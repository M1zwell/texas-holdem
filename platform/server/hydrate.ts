import { loadRuntime, loadRuntimeByCode } from './supabase'
import { rooms } from './rooms/registry'
import { store, type Lobby } from './store'

export async function ensureLobby(id: string): Promise<Lobby> {
  if (store.lobbies.has(id)) return store.requireLobby(id)
  const loaded = await loadRuntime(id)
  if (!loaded) {
    throw Object.assign(new Error('Room not found'), { status: 404, reason: 'closed' })
  }
  store.putLobby(loaded.lobby)
  if (loaded.roomState) rooms.hydrate(loaded.lobby, loaded.roomState)
  return loaded.lobby
}

export async function ensureLobbyByCode(code: string): Promise<Lobby> {
  const normalized = code.trim().toUpperCase()
  if (store.codes.has(normalized)) {
    return store.requireLobby(store.codes.get(normalized)!)
  }
  const loaded = await loadRuntimeByCode(normalized)
  if (!loaded) {
    throw Object.assign(new Error('Invalid invite code'), { status: 400, reason: 'invalid' })
  }
  store.putLobby(loaded.lobby)
  if (loaded.roomState) rooms.hydrate(loaded.lobby, loaded.roomState)
  return loaded.lobby
}
