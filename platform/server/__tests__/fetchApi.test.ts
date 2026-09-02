import { describe, expect, it } from 'vitest'
import { handlePokerApi } from '../fetchApi'

describe('fetch poker API', () => {
  it('serves health under /poker/api and /api', async () => {
    const a = await handlePokerApi(new Request('https://jubuddy.com/poker/api/health'))
    const b = await handlePokerApi(new Request('https://jubuddy.com/api/health'))
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    const body = (await a.json()) as { ok: boolean; service: string }
    expect(body.ok).toBe(true)
    expect(body.service).toBe('jub-poker')
  })

  it('creates a guest session and a tictactoe lobby over REST', async () => {
    const sessionRes = await handlePokerApi(
      new Request('https://jubuddy.com/poker/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Cloud' }),
      }),
    )
    expect(sessionRes.status).toBe(200)
    const session = (await sessionRes.json()) as { token: string; user: { name: string } }
    expect(session.user.name).toBe('Cloud')

    const lobbyRes = await handlePokerApi(
      new Request('https://jubuddy.com/poker/api/lobbies', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ name: 'CF table', game: 'tictactoe', fillBots: false }),
      }),
    )
    expect(lobbyRes.status).toBe(201)
    const created = (await lobbyRes.json()) as { lobby: { id: string; game: string }; code: string }
    expect(created.lobby.game).toBe('tictactoe')
    expect(created.code).toHaveLength(6)

    const playRes = await handlePokerApi(
      new Request(`https://jubuddy.com/poker/api/lobbies/${created.lobby.id}/play`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ type: 'start' }),
      }),
    )
    expect(playRes.status).toBe(200)
    const played = (await playRes.json()) as { state: { kind: string } }
    expect(played.state.kind).toBe('tictactoe')
  })
})
