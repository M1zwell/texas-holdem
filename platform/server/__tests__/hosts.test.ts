import { describe, expect, it } from 'vitest'
import { handlePokerApi } from '../fetchApi'
import { isMizHost } from '../hosts'

describe('miz.gg host', () => {
  it('treats miz.gg and m1z.gg as apex poker hosts', () => {
    expect(isMizHost('miz.gg')).toBe(true)
    expect(isMizHost('www.miz.gg')).toBe(true)
    expect(isMizHost('jubuddy.com')).toBe(false)
  })

  it('issues invite URLs on the miz.gg origin', async () => {
    const sessionRes = await handlePokerApi(
      new Request('https://miz.gg/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Miz' }),
      }),
    )
    const session = (await sessionRes.json()) as { token: string }
    const lobbyRes = await handlePokerApi(
      new Request('https://miz.gg/api/lobbies', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ name: 'Apex', game: 'tictactoe', fillBots: false }),
      }),
    )
    expect(lobbyRes.status).toBe(201)
    const created = (await lobbyRes.json()) as { inviteUrl: string }
    expect(created.inviteUrl.startsWith('https://miz.gg/join?token=')).toBe(true)
  })
})
