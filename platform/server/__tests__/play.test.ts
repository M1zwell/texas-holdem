import { describe, expect, it } from 'vitest'
import { applyPlay } from '../play'
import { store } from '../store'

describe('REST play', () => {
  it('starts tic-tac-toe and accepts a legal move', async () => {
    const host = store.upsertUser({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Host',
      guest: true,
    })
    const lobby = store.createLobby({
      host,
      name: 'TTT',
      game: 'tictactoe',
      maxPlayers: 2,
      approvalRequired: false,
      singleUseInvites: false,
      streamerMode: false,
      fillBots: false,
    })
    const guest = store.upsertUser({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Guest',
      guest: true,
    })
    store.requestJoin(lobby.id, guest)

    const started = await applyPlay(lobby.id, host, { type: 'start' })
    expect(started.state.kind).toBe('tictactoe')

    const moved = await applyPlay(lobby.id, host, { type: 'ttt_move', index: 0 })
    expect(moved.state.kind).toBe('tictactoe')
    if (moved.state.kind === 'tictactoe') {
      expect(moved.state.board[0]).toBe('X')
    }
  })

  it('deals a blackjack hand over REST play', async () => {
    const host = store.upsertUser({
      id: '44444444-4444-4444-8444-444444444444',
      name: 'BJHost',
      guest: true,
    })
    const lobby = store.createLobby({
      host,
      name: 'BJ deal',
      game: 'blackjack',
      maxPlayers: 6,
      approvalRequired: false,
      singleUseInvites: false,
      streamerMode: false,
      fillBots: false,
    })
    const dealt = await applyPlay(lobby.id, host, { type: 'blackjack_deal', amount: 100 })
    expect(dealt.state.kind).toBe('blackjack')
    if (dealt.state.kind === 'blackjack') {
      expect(dealt.state.player.cards.length).toBeGreaterThanOrEqual(2)
      expect(dealt.state.bet).toBe(100)
    }
  })

  it('rejects unknown play types', async () => {
    const host = store.upsertUser({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Host',
      guest: true,
    })
    const lobby = store.createLobby({
      host,
      name: 'BJ',
      game: 'blackjack',
      maxPlayers: 6,
      approvalRequired: false,
      singleUseInvites: false,
      streamerMode: false,
      fillBots: false,
    })
    await expect(applyPlay(lobby.id, host, { type: 'explode' })).rejects.toThrow(/Unknown play/)
  })
})
