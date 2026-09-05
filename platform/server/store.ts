import { randomUUID } from 'node:crypto'
import type { ChatMessage, GameKind, LobbyPreview, LobbyStatus, SessionUser } from '../shared/types'
import {
  DEFAULT_INVITE_TTL_MS,
  isInviteLive,
  randomJoinCode,
  type InviteRecord,
} from '../engine/invite'
import type { PublicGameState } from '../shared/types'

export interface Waiter {
  user: SessionUser
  requestedAt: number
}

export interface Lobby {
  id: string
  name: string
  game: GameKind
  hostId: string
  hostName: string
  status: LobbyStatus
  maxPlayers: number
  approvalRequired: boolean
  streamerMode: boolean
  singleUseInvites: boolean
  invite: InviteRecord
  members: SessionUser[]
  waitlist: Waiter[]
  createdAt: number
  blinds?: { small: number; big: number }
  fillBots: boolean
  chats: ChatMessage[]
}

export class MemoryStore {
  users = new Map<string, SessionUser>()
  lobbies = new Map<string, Lobby>()
  codes = new Map<string, string>()
  states = new Map<string, PublicGameState>()
  balances = new Map<string, number>()
  /** `updated_at` of the persisted row each lobby was last hydrated from. */
  loadedAt = new Map<string, string>()

  upsertUser(user: SessionUser): SessionUser {
    this.users.set(user.id, user)
    if (!this.balances.has(user.id)) {
      this.balances.set(user.id, 5000)
    }
    return user
  }

  createLobby(args: {
    host: SessionUser
    name: string
    game: GameKind
    maxPlayers: number
    approvalRequired: boolean
    singleUseInvites: boolean
    streamerMode: boolean
    fillBots: boolean
    blinds?: { small: number; big: number }
    ttlMs?: number
  }): Lobby {
    const id = randomUUID()
    const now = Date.now()
    const ttl = args.ttlMs ?? DEFAULT_INVITE_TTL_MS
    const invite: InviteRecord = {
      code: randomJoinCode(),
      lobbyId: id,
      hostId: args.host.id,
      createdAt: now,
      expiresAt: now + ttl,
      singleUse: args.singleUseInvites,
      used: false,
    }
    const lobby: Lobby = {
      id,
      name: args.name.trim().slice(0, 48) || defaultName(args.game),
      game: args.game,
      hostId: args.host.id,
      hostName: args.host.name,
      status: 'waiting',
      maxPlayers: clampMax(args.game, args.maxPlayers),
      approvalRequired: args.approvalRequired,
      streamerMode: args.streamerMode,
      singleUseInvites: args.singleUseInvites,
      invite,
      members: [args.host],
      waitlist: [],
      createdAt: now,
      blinds: args.blinds,
      fillBots: args.fillBots,
      chats: [],
    }
    this.lobbies.set(id, lobby)
    this.codes.set(invite.code, id)
    return lobby
  }

  putLobby(lobby: Lobby): Lobby {
    if (!lobby.chats) lobby.chats = []
    this.lobbies.set(lobby.id, lobby)
    this.codes.set(lobby.invite.code, lobby.id)
    for (const member of lobby.members) {
      this.upsertUser(member)
    }
    return lobby
  }

  addChat(lobbyId: string, message: ChatMessage): ChatMessage {
    const lobby = this.requireLobby(lobbyId)
    lobby.chats = [...lobby.chats.slice(-39), message]
    return message
  }

  regenerateInvite(lobbyId: string, hostId: string, ttlMs = DEFAULT_INVITE_TTL_MS): InviteRecord {
    const lobby = this.requireLobby(lobbyId)
    if (lobby.hostId !== hostId) {
      throw Object.assign(new Error('Only the host can regenerate the code'), { status: 403 })
    }
    this.codes.delete(lobby.invite.code)
    const now = Date.now()
    lobby.invite = {
      code: randomJoinCode(),
      lobbyId,
      hostId,
      createdAt: now,
      expiresAt: now + ttlMs,
      singleUse: lobby.singleUseInvites,
      used: false,
    }
    this.codes.set(lobby.invite.code, lobbyId)
    return lobby.invite
  }

  previewByCode(code: string): LobbyPreview {
    const lobbyId = this.codes.get(code)
    if (!lobbyId) {
      throw Object.assign(new Error('Invalid invite code'), { status: 400, reason: 'invalid' })
    }
    return this.preview(lobbyId)
  }

  preview(lobbyId: string): LobbyPreview {
    const lobby = this.requireLobby(lobbyId)
    const live = isInviteLive(lobby.invite)
    if (!live.ok) {
      throw Object.assign(
        new Error(live.reason === 'expired' ? 'Invite expired' : 'Invite already used'),
        {
          status: live.reason === 'expired' ? 410 : 400,
          reason: live.reason,
        },
      )
    }
    if (lobby.status === 'closed') {
      throw Object.assign(new Error('Room closed'), { status: 404, reason: 'closed' })
    }
    return {
      lobbyId: lobby.id,
      name: lobby.name,
      hostName: lobby.hostName,
      game: lobby.game,
      status: lobby.status,
      playerCount: lobby.members.length,
      maxPlayers: lobby.maxPlayers,
      approvalRequired: lobby.approvalRequired,
      expiresAt: lobby.invite.expiresAt,
      blinds: lobby.blinds,
    }
  }

  requestJoin(
    lobbyId: string,
    user: SessionUser,
  ): { joined: boolean; waitlisted: boolean; preview: LobbyPreview } {
    const lobby = this.requireLobby(lobbyId)
    const preview = this.preview(lobbyId)
    if (lobby.members.some((m) => m.id === user.id)) {
      return { joined: true, waitlisted: false, preview }
    }
    if (lobby.members.length >= lobby.maxPlayers) {
      throw Object.assign(new Error('Room is full'), { status: 403, reason: 'full' })
    }
    if (lobby.status === 'playing' && lobby.game === 'holdem') {
      throw Object.assign(
        new Error('Hand already in progress — ask the host to spectate next hand'),
        {
          status: 403,
          reason: 'playing',
        },
      )
    }
    if (lobby.approvalRequired && user.id !== lobby.hostId) {
      if (!lobby.waitlist.some((w) => w.user.id === user.id)) {
        lobby.waitlist.push({ user, requestedAt: Date.now() })
      }
      return { joined: false, waitlisted: true, preview }
    }
    lobby.members.push(user)
    if (lobby.invite.singleUse) {
      lobby.invite.used = true
    }
    return { joined: true, waitlisted: false, preview }
  }

  approve(lobbyId: string, hostId: string, userId: string): SessionUser {
    const lobby = this.requireLobby(lobbyId)
    if (lobby.hostId !== hostId) {
      throw Object.assign(new Error('Only the host can approve'), { status: 403 })
    }
    const idx = lobby.waitlist.findIndex((w) => w.user.id === userId)
    if (idx < 0) {
      throw Object.assign(new Error('Not on waitlist'), { status: 404 })
    }
    const [waiter] = lobby.waitlist.splice(idx, 1)
    if (lobby.members.length >= lobby.maxPlayers) {
      throw Object.assign(new Error('Room is full'), { status: 403, reason: 'full' })
    }
    lobby.members.push(waiter!.user)
    return waiter!.user
  }

  leave(lobbyId: string, userId: string): void {
    const lobby = this.lobbies.get(lobbyId)
    if (!lobby) return
    lobby.members = lobby.members.filter((m) => m.id !== userId)
    lobby.waitlist = lobby.waitlist.filter((w) => w.user.id !== userId)
    if (lobby.members.length === 0) {
      lobby.status = 'closed'
      this.codes.delete(lobby.invite.code)
    } else if (lobby.hostId === userId) {
      lobby.hostId = lobby.members[0]!.id
      lobby.hostName = lobby.members[0]!.name
    }
  }

  requireLobby(id: string): Lobby {
    const lobby = this.lobbies.get(id)
    if (!lobby) {
      throw Object.assign(new Error('Room not found'), { status: 404, reason: 'closed' })
    }
    return lobby
  }
}

function defaultName(game: GameKind): string {
  switch (game) {
    case 'holdem':
      return "Private Hold'em"
    case 'baccarat':
      return 'Private Baccarat'
    case 'tictactoe':
      return 'Private Tic-Tac-Toe'
    case 'blackjack':
      return 'Private Blackjack'
    case 'fortyfive':
      return 'Private 45-Bust'
    default: {
      const _n: never = game
      return _n
    }
  }
}

function clampMax(game: GameKind, n: number): number {
  const max =
    game === 'holdem'
      ? 9
      : game === 'baccarat' || game === 'fortyfive'
      ? 8
      : game === 'blackjack'
      ? 6
      : 2
  const min = 2
  return Math.min(max, Math.max(min, Math.floor(n) || max))
}

export const store = new MemoryStore()
