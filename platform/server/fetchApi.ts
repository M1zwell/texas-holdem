import type { GameKind } from '../shared/types'
import { guestUser, readBearer, signInvite, signSession, verifyInvite, verifySession } from './auth'
import { config } from './config'
import { isMizHost } from './hosts'
import { ensureLobby, ensureLobbyByCode } from './hydrate'
import { applyPlay } from './play'
import { rooms } from './rooms/registry'
import { store, type Lobby } from './store'
import { persistRuntime, listRemoteLobbies, supabaseEnabled } from './supabase'
import { publicLobby } from './view'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function fail(err: unknown): Response {
  const e = err as { status?: number; message?: string; reason?: string; name?: string }
  if (e.name === 'TokenExpiredError' || e.message === 'JWTExpired') {
    return json(
      { error: 'This invite link has expired. Ask the host for a new code.', reason: 'expired' },
      410,
    )
  }
  return json({ error: e.message ?? 'Bad request', reason: e.reason }, e.status ?? 400)
}

function requireUser(request: Request) {
  const token = readBearer(request.headers.get('authorization') ?? undefined)
  if (!token) {
    throw Object.assign(new Error('Sign in first'), { status: 401 })
  }
  return verifySession(token)
}

function publicBase(request: Request): string {
  const url = new URL(request.url)
  if (isMizHost(url.hostname)) {
    const host = url.hostname === 'www.miz.gg' ? 'miz.gg' : url.hostname
    return `${url.protocol}//${host}`
  }
  const base = config.basePath || ''
  return `${config.publicUrl}${base}`
}

function isGameKind(value: string): value is GameKind {
  switch (value) {
    case 'holdem':
    case 'baccarat':
    case 'tictactoe':
    case 'blackjack':
    case 'fortyfive':
      return true
    default:
      return false
  }
}

function apiPath(pathname: string): string {
  if (pathname.startsWith('/poker/api')) return pathname.slice('/poker/api'.length) || '/'
  if (pathname.startsWith('/api')) return pathname.slice('/api'.length) || '/'
  return pathname
}

/** Fetch-native poker API for Cloudflare Workers (and tests). No Express. */
/** What `persistRuntime` would write for this lobby, as a comparable string. */
export function runtimeFingerprint(lobby: Lobby): string {
  return JSON.stringify({ lobby, room: rooms.serialize(lobby) })
}

export async function handlePokerApi(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = apiPath(url.pathname)
  const method = request.method.toUpperCase()
  let body: Record<string, unknown> = {}
  if (method !== 'GET' && method !== 'HEAD') {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  }

  try {
    if (method === 'GET' && path === '/health') {
      return json({
        ok: true,
        service: 'jub-poker',
        runtime: 'worker',
        time: Date.now(),
        supabase: supabaseEnabled(),
        realtime: supabaseEnabled(),
        socket: Boolean(process.env.FLY_SOCKET_ORIGIN) || !config.serverless,
      })
    }

    if (method === 'POST' && path === '/session') {
      const user = store.upsertUser(guestUser(String(body.name ?? '')))
      return json({ token: signSession(user), user, balance: store.balances.get(user.id) })
    }

    if (method === 'GET' && path === '/me') {
      const user = requireUser(request)
      return json({ user, balance: store.balances.get(user.id) ?? 0 })
    }

    if (method === 'POST' && path === '/lobbies') {
      const user = requireUser(request)
      const game = String(body.game ?? 'holdem')
      if (!isGameKind(game)) return json({ error: 'Unknown game' }, 400)
      const lobby = store.createLobby({
        host: user,
        name: String(body.name ?? ''),
        game,
        maxPlayers: Number(
          body.maxPlayers ?? (game === 'tictactoe' ? 2 : game === 'blackjack' ? 6 : 6),
        ),
        approvalRequired: Boolean(body.approvalRequired),
        singleUseInvites: Boolean(body.singleUseInvites),
        streamerMode: Boolean(body.streamerMode),
        fillBots: body.fillBots !== false,
        blinds:
          game === 'holdem'
            ? { small: Number(body.smallBlind ?? 50), big: Number(body.bigBlind ?? 100) }
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
      rooms.get(lobby)
      await persistRuntime(lobby)
      return json(
        {
          lobby: publicLobby(lobby, true),
          inviteUrl: `${publicBase(request)}/join?token=${token}`,
          code: lobby.invite.code,
          expiresAt: lobby.invite.expiresAt,
        },
        201,
      )
    }

    if (method === 'GET' && path === '/lobbies/preview') {
      const token = url.searchParams.get('token') ?? ''
      const code = (url.searchParams.get('code') ?? '').trim().toUpperCase()
      if (token) {
        const claims = verifyInvite(token)
        await ensureLobby(claims.lobbyId)
        const preview = store.preview(claims.lobbyId)
        if (claims.code !== store.requireLobby(claims.lobbyId).invite.code) {
          return json(
            {
              error: 'This invite was regenerated. Ask the host for the new code.',
              reason: 'invalid',
            },
            400,
          )
        }
        return json({ valid: true, preview })
      }
      if (!code) return json({ error: 'Invite credential missing.', reason: 'missing' }, 400)
      await ensureLobbyByCode(code)
      return json({ valid: true, preview: store.previewByCode(code) })
    }

    if (method === 'GET' && path === '/lobbies') {
      const remote = await listRemoteLobbies()
      const memory = [...store.lobbies.values()]
        .filter((l) => l.status !== 'closed')
        .map((l) => ({
          id: l.id,
          name: l.name,
          game: l.game,
          playerCount: l.members.length,
          maxPlayers: l.maxPlayers,
          status: l.status,
        }))
      const seen = new Set(memory.map((l) => l.id))
      return json({ lobbies: [...memory, ...remote.filter((l) => !seen.has(l.id))] })
    }

    const lobbyMatch = path.match(
      /^\/lobbies\/([^/]+)(?:\/(join|play|regenerate|approve|streamer))?$/,
    )
    if (lobbyMatch) {
      const lobbyId = lobbyMatch[1]!
      const action = lobbyMatch[2]
      if (method === 'GET' && !action) {
        const user = requireUser(request)
        const lobby = await ensureLobby(lobbyId)
        const member = lobby.members.some((m) => m.id === user.id) || lobby.hostId === user.id
        if (!member) return json({ error: 'Join the lobby first' }, 403)
        // A read may advance the table (expired turn, bots, the next deal) —
        // and only then may it write. Persisting every GET bumped `updated_at`
        // on every poll, and since table clients subscribe to that row over
        // Supabase Realtime, each poll's write woke every client, whose pull
        // wrote again: a self-sustaining loop across everyone at the table.
        const before = runtimeFingerprint(lobby)
        const state = rooms.snapshot(lobby, user.id)
        if (runtimeFingerprint(lobby) !== before) await persistRuntime(lobby)
        return json({ lobby: publicLobby(lobby, lobby.hostId === user.id), state })
      }
      if (method === 'POST' && action === 'join') {
        const user = requireUser(request)
        const lobby = await ensureLobby(lobbyId)
        const result = store.requestJoin(lobby.id, user)
        if (result.joined) rooms.get(lobby)
        await persistRuntime(lobby)
        return json(result)
      }
      if (method === 'POST' && action === 'play') {
        const user = requireUser(request)
        await ensureLobby(lobbyId)
        return json(await applyPlay(lobbyId, user, body))
      }
      if (method === 'POST' && action === 'regenerate') {
        const user = requireUser(request)
        await ensureLobby(lobbyId)
        const invite = store.regenerateInvite(lobbyId, user.id)
        const token = signInvite(
          {
            typ: 'invite',
            lobbyId,
            code: invite.code,
            hostId: user.id,
            game: store.requireLobby(lobbyId).game,
            singleUse: invite.singleUse,
          },
          config.inviteTtlMs,
        )
        await persistRuntime(store.requireLobby(lobbyId))
        return json({
          code: invite.code,
          expiresAt: invite.expiresAt,
          inviteUrl: `${publicBase(request)}/join?token=${token}`,
        })
      }
      if (method === 'POST' && action === 'approve') {
        const user = requireUser(request)
        await ensureLobby(lobbyId)
        const approved = store.approve(lobbyId, user.id, String(body.userId ?? ''))
        await persistRuntime(store.requireLobby(lobbyId))
        return json({ approved })
      }
      if (method === 'POST' && action === 'streamer') {
        const user = requireUser(request)
        const lobby = await ensureLobby(lobbyId)
        if (lobby.hostId !== user.id)
          return json({ error: 'Only the host can toggle streamer mode' }, 403)
        lobby.streamerMode = Boolean(body.enabled)
        await persistRuntime(lobby)
        return json({ streamerMode: lobby.streamerMode })
      }
    }

    return json({ error: 'Not found' }, 404)
  } catch (err) {
    return fail(err)
  }
}
