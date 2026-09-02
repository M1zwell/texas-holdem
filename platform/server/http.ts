import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config'
import { guestUser, readBearer, signInvite, signSession, verifyInvite, verifySession } from './auth'
import { store } from './store'
import { rooms } from './rooms/registry'
import { persistLobby } from './supabase'
import type { GameKind } from '../shared/types'

const joinLimiter = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many join attempts. Try again in a minute.', reason: 'rate_limited' },
})

const createLimiter = rateLimit({
  windowMs: 60_000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many rooms created. Slow down.', reason: 'rate_limited' },
})

function auth(req: express.Request): ReturnType<typeof verifySession> {
  const token = readBearer(req.headers.authorization)
  if (!token) {
    throw Object.assign(new Error('Sign in first'), { status: 401 })
  }
  return verifySession(token)
}

function sendErr(res: express.Response, err: unknown): void {
  const e = err as { status?: number; message?: string; reason?: string; name?: string }
  if (e.name === 'TokenExpiredError') {
    res.status(410).json({
      error: 'This invite link has expired. Ask the host for a new code.',
      reason: 'expired',
    })
    return
  }
  res.status(e.status ?? 400).json({ error: e.message ?? 'Bad request', reason: e.reason })
}

export function createHttp() {
  const app = express()
  app.set('trust proxy', 1)
  app.use(cors({ origin: config.corsOrigin, credentials: true }))
  app.use(express.json({ limit: '32kb' }))

  const api = express.Router()

  api.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'jub-poker', time: Date.now() })
  })

  api.post('/session', (req, res) => {
    try {
      const user = store.upsertUser(guestUser(String(req.body?.name ?? '')))
      res.json({ token: signSession(user), user, balance: store.balances.get(user.id) })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.get('/me', (req, res) => {
    try {
      const user = auth(req)
      res.json({ user, balance: store.balances.get(user.id) ?? 0 })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.post('/lobbies', createLimiter, (req, res) => {
    try {
      const user = auth(req)
      const game = (req.body?.game ?? 'holdem') as GameKind
      if (
        game !== 'holdem' &&
        game !== 'baccarat' &&
        game !== 'tictactoe' &&
        game !== 'blackjack' &&
        game !== 'fortyfive'
      ) {
        res.status(400).json({ error: 'Unknown game' })
        return
      }
      const lobby = store.createLobby({
        host: user,
        name: String(req.body?.name ?? ''),
        game,
        maxPlayers: Number(
          req.body?.maxPlayers ?? (game === 'tictactoe' ? 2 : game === 'blackjack' ? 6 : 6),
        ),
        approvalRequired: Boolean(req.body?.approvalRequired),
        singleUseInvites: Boolean(req.body?.singleUseInvites),
        streamerMode: Boolean(req.body?.streamerMode),
        fillBots: req.body?.fillBots !== false,
        blinds:
          game === 'holdem'
            ? { small: Number(req.body?.smallBlind ?? 50), big: Number(req.body?.bigBlind ?? 100) }
            : undefined,
      })
      const token = signInvite(
        {
          typ: 'invite',
          lobbyId: lobby.id,
          code: lobby.invite.code,
          hostId: lobby.hostId,
          game: lobby.game,
          singleUse: lobby.singleUseInvites,
        },
        config.inviteTtlMs,
      )
      void persistLobby(lobby)
      res.status(201).json({
        lobby: publicLobby(lobby, true),
        inviteUrl: `${publicBase()}/join?token=${token}`,
        code: lobby.invite.code,
        expiresAt: lobby.invite.expiresAt,
      })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.get('/lobbies/preview', joinLimiter, (req, res) => {
    try {
      const token = typeof req.query.token === 'string' ? req.query.token : ''
      const code = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : ''
      if (token) {
        const claims = verifyInvite(token)
        const preview = store.preview(claims.lobbyId)
        if (claims.code !== store.requireLobby(claims.lobbyId).invite.code) {
          res.status(400).json({
            error: 'This invite was regenerated. Ask the host for the new code.',
            reason: 'invalid',
          })
          return
        }
        res.json({ valid: true, preview })
        return
      }
      if (!code) {
        res.status(400).json({ error: 'Invite credential missing.', reason: 'missing' })
        return
      }
      res.json({ valid: true, preview: store.previewByCode(code) })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.post('/lobbies/:id/join', joinLimiter, (req, res) => {
    try {
      const user = auth(req)
      const result = store.requestJoin(req.params.id, user)
      const lobby = store.requireLobby(req.params.id)
      if (result.joined) {
        rooms.get(lobby)
      }
      res.json(result)
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.post('/lobbies/:id/regenerate', (req, res) => {
    try {
      const user = auth(req)
      const invite = store.regenerateInvite(req.params.id, user.id)
      const token = signInvite(
        {
          typ: 'invite',
          lobbyId: req.params.id,
          code: invite.code,
          hostId: user.id,
          game: store.requireLobby(req.params.id).game,
          singleUse: invite.singleUse,
        },
        config.inviteTtlMs,
      )
      res.json({
        code: invite.code,
        expiresAt: invite.expiresAt,
        inviteUrl: `${publicBase()}/join?token=${token}`,
      })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.post('/lobbies/:id/approve', (req, res) => {
    try {
      const user = auth(req)
      const approved = store.approve(req.params.id, user.id, String(req.body?.userId ?? ''))
      res.json({ approved })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.post('/lobbies/:id/streamer', (req, res) => {
    try {
      const user = auth(req)
      const lobby = store.requireLobby(req.params.id)
      if (lobby.hostId !== user.id) {
        res.status(403).json({ error: 'Only the host can toggle streamer mode' })
        return
      }
      lobby.streamerMode = Boolean(req.body?.enabled)
      res.json({ streamerMode: lobby.streamerMode })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.get('/lobbies/:id', (req, res) => {
    try {
      const user = auth(req)
      const lobby = store.requireLobby(req.params.id)
      const member = lobby.members.some((m) => m.id === user.id) || lobby.hostId === user.id
      if (!member) {
        res.status(403).json({ error: 'Join the lobby first' })
        return
      }
      res.json({
        lobby: publicLobby(lobby, lobby.hostId === user.id),
        state: rooms.snapshot(lobby, user.id),
      })
    } catch (err) {
      sendErr(res, err)
    }
  })

  api.get('/lobbies', (_req, res) => {
    const list = [...store.lobbies.values()]
      .filter((l) => l.status !== 'closed')
      .map((l) => ({
        id: l.id,
        name: l.name,
        game: l.game,
        playerCount: l.members.length,
        maxPlayers: l.maxPlayers,
        status: l.status,
      }))
    res.json({ lobbies: list })
  })

  const base = config.basePath || ''
  app.use(`${base}/api`, api)
  if (base) {
    app.use('/api', api)
  }

  const webDir = path.resolve(process.cwd(), 'apps/web-dist')
  const altDir = path.resolve(process.cwd(), 'platform/web/dist')
  const staticDir = process.env.WEB_DIST || (fs.existsSync(webDir) ? webDir : altDir)
  if (fs.existsSync(staticDir)) {
    if (base) {
      app.use(base, express.static(staticDir))
      app.get(`${base}/*`, (_req, res) => {
        res.sendFile(path.join(staticDir, 'index.html'))
      })
    }
    app.use(express.static(staticDir))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        next()
        return
      }
      res.sendFile(path.join(staticDir, 'index.html'))
    })
  }

  return app
}

function publicBase(): string {
  const base = config.basePath || ''
  return `${config.publicUrl}${base}`
}

function publicLobby(lobby: ReturnType<typeof store.requireLobby>, hostView: boolean) {
  return {
    id: lobby.id,
    name: lobby.name,
    game: lobby.game,
    hostId: lobby.hostId,
    hostName: lobby.hostName,
    status: lobby.status,
    maxPlayers: lobby.maxPlayers,
    approvalRequired: lobby.approvalRequired,
    streamerMode: lobby.streamerMode,
    members: lobby.members,
    waitlist: hostView ? lobby.waitlist : [],
    code:
      hostView && !lobby.streamerMode
        ? lobby.invite.code
        : hostView
        ? lobby.invite.code
        : undefined,
    codeBlurred: lobby.streamerMode,
    expiresAt: lobby.invite.expiresAt,
    blinds: lobby.blinds,
    fillBots: lobby.fillBots,
  }
}
