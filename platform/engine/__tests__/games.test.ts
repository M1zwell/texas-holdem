import { describe, expect, it } from 'vitest'
import { newBaccaratShoe, resolveBaccarat, shouldBankerDraw, baccaratTotal } from '../baccarat'
import { emptyTtt, playTtt, minimaxMove, tttWinner } from '../tictactoe'
import { isInviteLive, randomJoinCode, normalizeJoinCode } from '../invite'
import { estimateEquity } from '../montecarlo'
import type { CardCode } from '../../shared/types'

describe('baccarat tableau', () => {
  it('banker stands on 7 vs player natural-less stand', () => {
    expect(shouldBankerDraw(7)).toBe(false)
    expect(shouldBankerDraw(5)).toBe(true)
    expect(shouldBankerDraw(3, '8s' as CardCode)).toBe(false)
    expect(shouldBankerDraw(6, '6h' as CardCode)).toBe(true)
  })

  it('settles player / banker / tie bets', () => {
    const shoe = ['As', '2s', '3s', '4s', '5s', '6s', '7s', '8s'] as CardCode[]
    const { result } = resolveBaccarat(shoe, [
      { playerId: 'p', seat: 'player', amount: 100 },
      { playerId: 'b', seat: 'banker', amount: 100 },
      { playerId: 't', seat: 'tie', amount: 50 },
    ])
    expect(['player', 'banker', 'tie']).toContain(result.winner)
    expect(baccaratTotal(result.playerCards)).toBe(result.playerTotal)
    expect(Object.keys(result.payouts).length).toBe(3)
  })

  it('builds an 8-deck shoe', () => {
    expect(newBaccaratShoe()).toHaveLength(416)
  })
})

describe('tic-tac-toe', () => {
  it('detects a row win and rejects occupied cells', () => {
    let s = emptyTtt()
    s = playTtt(s, 0)
    s = playTtt(s, 3)
    s = playTtt(s, 1)
    s = playTtt(s, 4)
    s = playTtt(s, 2)
    expect(s.winner).toBe('X')
    expect(() => playTtt(s, 8)).toThrow()
  })

  it('minimax never loses from empty board as O vs perfect X', () => {
    let s = emptyTtt()
    while (!s.winner) {
      if (s.xIsNext) {
        s = playTtt(s, minimaxMove(s.board, 'X'))
      } else {
        s = playTtt(s, minimaxMove(s.board, 'O'))
      }
    }
    expect(s.winner).toBe('draw')
    expect(tttWinner(s.board)).toBe('draw')
  })
})

describe('invite codes', () => {
  it('emits 6-char Crockford codes and flags expiry', () => {
    const code = randomJoinCode()
    expect(code).toHaveLength(6)
    expect(normalizeJoinCode('ab c')).toBe('ABC')
    const live = isInviteLive({
      code,
      lobbyId: 'x',
      hostId: 'h',
      createdAt: 0,
      expiresAt: Date.now() + 1000,
      singleUse: false,
      used: false,
    })
    expect(live.ok).toBe(true)
    const dead = isInviteLive({
      code,
      lobbyId: 'x',
      hostId: 'h',
      createdAt: 0,
      expiresAt: Date.now() - 1,
      singleUse: false,
      used: false,
    })
    expect(dead).toEqual({ ok: false, reason: 'expired' })
  })
})

describe('monte carlo equity', () => {
  it('gives AA a high preflop win rate vs one opponent', () => {
    const eq = estimateEquity(['As', 'Ad'], [], 300, 1)
    expect(eq.win).toBeGreaterThan(0.75)
  })
})
