import { loadRuntime, loadRuntimeByCode, supabaseEnabled, type LoadedRuntime } from './supabase'
import { rooms } from './rooms/registry'
import { store, type Lobby } from './store'

/**
 * Adopt a persisted runtime into this isolate — unless it is the very row this
 * isolate already hydrated from, in which case the in-memory copy is newer or
 * equal and must not be rolled back.
 */
function adopt(loaded: LoadedRuntime): Lobby {
  const id = loaded.lobby.id
  const cached = store.lobbies.get(id)
  const stamp = loaded.updatedAt ?? ''
  if (cached && store.loadedAt.get(id) === stamp) return cached
  store.putLobby(loaded.lobby)
  if (loaded.roomState) rooms.hydrate(loaded.lobby, loaded.roomState)
  store.loadedAt.set(id, stamp)
  return loaded.lobby
}

/**
 * The lobby as the SHARED store knows it, not as this isolate last saw it.
 *
 * A serverless host runs many isolates, each with its own memory. This used to
 * return the in-memory copy whenever one existed, so an isolate that had
 * touched a table once kept its own fork of it forever — advancing hands and
 * persisting them over whatever the other isolates persisted. Two players'
 * polls landed on different isolates and saw different games. Now every request
 * checks the row's `updated_at` and re-hydrates when someone else has written.
 * One SELECT per request; the in-memory copy is a cache, not the truth.
 */
export async function ensureLobby(id: string): Promise<Lobby> {
  const cached = store.lobbies.get(id)
  if (!supabaseEnabled()) {
    if (cached) return cached
    throw Object.assign(new Error('Room not found'), { status: 404, reason: 'closed' })
  }
  const loaded = await loadRuntime(id)
  if (!loaded) {
    if (cached) return cached
    throw Object.assign(new Error('Room not found'), { status: 404, reason: 'closed' })
  }
  return adopt(loaded)
}

export async function ensureLobbyByCode(code: string): Promise<Lobby> {
  const normalized = code.trim().toUpperCase()
  const cachedId = store.codes.get(normalized)
  if (!supabaseEnabled()) {
    if (cachedId) return store.requireLobby(cachedId)
    throw Object.assign(new Error('Invalid invite code'), { status: 400, reason: 'invalid' })
  }
  const loaded = await loadRuntimeByCode(normalized)
  if (!loaded) {
    if (cachedId) return store.requireLobby(cachedId)
    throw Object.assign(new Error('Invalid invite code'), { status: 400, reason: 'invalid' })
  }
  return adopt(loaded)
}
