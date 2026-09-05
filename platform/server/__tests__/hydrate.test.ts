import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The bug this guards: `ensureLobby` returned the in-memory copy whenever one
 * existed, so a Worker isolate that had touched a table once kept its own fork
 * of it forever. Now it compares the shared row's `updated_at` with the version
 * this isolate hydrated from, and re-hydrates when someone else has written.
 */
const row = {
  lobby: null as any,
  roomState: null as any,
  updatedAt: '2026-09-05T00:00:00.000Z',
}

vi.mock('../supabase', () => ({
  supabaseEnabled: () => true,
  loadRuntime: async (id: string) =>
    row.lobby && row.lobby.id === id
      ? { lobby: structuredClone(row.lobby), roomState: row.roomState, updatedAt: row.updatedAt }
      : null,
  loadRuntimeByCode: async () => null,
  persistRuntime: async () => undefined,
}))

describe('ensureLobby across isolates', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function fresh() {
    const { store } = await import('../store')
    const { ensureLobby } = await import('../hydrate')
    return { store, ensureLobby }
  }

  it('adopts a row it has not seen, and re-uses it while the row is unchanged', async () => {
    const { store, ensureLobby } = await fresh()
    const host = store.upsertUser({ id: 'h-1', name: 'Host', guest: true })
    const seed = store.createLobby({
      host,
      name: 'Shared',
      game: 'tictactoe',
      maxPlayers: 2,
      approvalRequired: false,
      singleUseInvites: false,
      streamerMode: false,
      fillBots: false,
    })
    row.lobby = seed
    store.lobbies.clear() // pretend this isolate is cold

    const first = await ensureLobby(seed.id)
    expect(first.name).toBe('Shared')
    const again = await ensureLobby(seed.id)
    expect(again).toBe(first) // same object: nothing newer was persisted
  })

  it('re-hydrates when another isolate has persisted a newer row', async () => {
    const { ensureLobby } = await fresh()
    const first = await ensureLobby(row.lobby.id)
    expect(first.name).toBe('Shared')

    // Another isolate renamed the lobby and persisted: newer updated_at.
    row.lobby = { ...row.lobby, name: 'Renamed elsewhere' }
    row.updatedAt = '2026-09-05T00:00:05.000Z'

    const second = await ensureLobby(row.lobby.id)
    expect(second.name).toBe('Renamed elsewhere')
    expect(second).not.toBe(first)
  })

  it('keeps serving the cached copy if the store is unreachable, rather than 404ing a live table', async () => {
    const { store, ensureLobby } = await fresh()
    await ensureLobby(row.lobby.id)
    const held = store.lobbies.get(row.lobby.id)
    const saved = row.lobby
    row.lobby = null // loadRuntime now returns null
    const result = await ensureLobby(saved.id)
    expect(result).toBe(held)
    row.lobby = saved
  })
})
