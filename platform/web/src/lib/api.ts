import type { GameKind, LobbyPreview, SessionUser } from '@shared/types'

const tokenKey = 'jub-poker-token'

export function getToken(): string | null {
  return localStorage.getItem(tokenKey)
}

export function setToken(token: string): void {
  localStorage.setItem(tokenKey, token)
}

export function apiRoot(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/api`
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${apiRoot()}${path}`, { ...init, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(new Error(data.error || res.statusText), {
      reason: data.reason,
      status: res.status,
    })
  }
  return data as T
}

export const api = {
  health: () => req<{ ok: boolean; socket?: boolean; supabase?: boolean }>('/health'),
  session: (name: string) =>
    req<{ token: string; user: SessionUser; balance: number }>('/session', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  me: () => req<{ user: SessionUser; balance: number }>('/me'),
  createLobby: (body: {
    name: string
    game: GameKind
    maxPlayers: number
    approvalRequired: boolean
    singleUseInvites: boolean
    streamerMode: boolean
    fillBots: boolean
    smallBlind?: number
    bigBlind?: number
  }) =>
    req<{ lobby: { id: string }; inviteUrl: string; code: string; expiresAt: number }>('/lobbies', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  preview: (q: { token?: string; code?: string }) => {
    const search = new URLSearchParams()
    if (q.token) search.set('token', q.token)
    if (q.code) search.set('code', q.code)
    return req<{ valid: boolean; preview: LobbyPreview }>(`/lobbies/preview?${search.toString()}`)
  },
  join: (id: string) =>
    req<{ joined: boolean; waitlisted: boolean; preview: LobbyPreview }>(`/lobbies/${id}/join`, {
      method: 'POST',
    }),
  getLobby: (id: string) => req<{ lobby: any; state: any }>(`/lobbies/${id}`),
  regenerate: (id: string) =>
    req<{ code: string; expiresAt: number; inviteUrl: string }>(`/lobbies/${id}/regenerate`, {
      method: 'POST',
    }),
  approve: (id: string, userId: string) =>
    req(`/lobbies/${id}/approve`, { method: 'POST', body: JSON.stringify({ userId }) }),
  streamer: (id: string, enabled: boolean) =>
    req(`/lobbies/${id}/streamer`, { method: 'POST', body: JSON.stringify({ enabled }) }),
  list: () =>
    req<{
      lobbies: Array<{
        id: string
        name: string
        game: GameKind
        playerCount: number
        maxPlayers: number
        status: string
      }>
    }>('/lobbies'),
  play: (id: string, body: Record<string, unknown>) =>
    req<{ lobby: any; state: any; chat?: { name: string; text: string } }>(`/lobbies/${id}/play`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
