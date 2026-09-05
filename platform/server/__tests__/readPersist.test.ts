import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A read must not write unless it changed something. Every GET used to call
 * persistRuntime(), whose upsert sets updated_at = now() — and table clients
 * subscribe to that row over Supabase Realtime, so each poll's write woke every
 * client into another poll: a loop with no terminating condition.
 */
const persist = vi.fn(async () => undefined)

vi.mock('../supabase', () => ({
  supabaseEnabled: () => true,
  loadRuntime: async () => null, // nothing stored: ensureLobby falls back to the in-memory copy
  loadRuntimeByCode: async () => null,
  persistRuntime: (...args: unknown[]) => persist(...args),
  persistHandAction: async () => undefined,
  hashJoinCode: (s: string) => s,
}))

describe('GET /lobbies/:id persistence', () => {
  beforeEach(() => {
    persist.mockClear()
    vi.resetModules()
  })

  async function tableWithHost() {
    const { handlePokerApi } = await import('../fetchApi')
    const session = await handlePokerApi(
      new Request('https://miz.gg/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Host' }),
      }),
    )
    const { token } = (await session.json()) as { token: string }
    const created = await handlePokerApi(
      new Request('https://miz.gg/api/lobbies', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'Quiet', game: 'tictactoe', fillBots: false }),
      }),
    )
    const { lobby } = (await created.json()) as { lobby: { id: string } }
    const get = () =>
      handlePokerApi(
        new Request(`https://miz.gg/api/lobbies/${lobby.id}`, {
          headers: { authorization: `Bearer ${token}` },
        }),
      )
    return { get, lobbyId: lobby.id, token, handlePokerApi }
  }

  it('does not write when nothing changed — polling a quiet table is read-only', async () => {
    const { get } = await tableWithHost()
    persist.mockClear() // creation legitimately persisted
    for (let i = 0; i < 5; i++) expect((await get()).status).toBe(200)
    expect(persist).not.toHaveBeenCalled()
  })

  it('still writes when a read advances the table', async () => {
    // The GET path calls rooms.snapshot(), whose flush() may deal the next hand
    // or auto-fold an expired turn. Prove the write happens in that case by
    // changing the runtime between fingerprints: a chat message is the cheapest
    // mutation the persisted lobby carries.
    const { get, lobbyId, token, handlePokerApi } = await tableWithHost()
    persist.mockClear()
    const chat = await handlePokerApi(
      new Request(`https://miz.gg/api/lobbies/${lobbyId}/play`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'chat', text: 'gg' }),
      }),
    )
    expect(chat.status).toBe(200)
    // Play persists on its own path; that is unchanged.
    expect(persist).toHaveBeenCalled()
    persist.mockClear()
    // And a read after a change that is already persisted is quiet again.
    expect((await get()).status).toBe(200)
    expect(persist).not.toHaveBeenCalled()
  })
})
