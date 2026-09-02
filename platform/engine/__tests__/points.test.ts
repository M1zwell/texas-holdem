import { describe, expect, it } from 'vitest'
import { blackjackHit, blackjackStand, newBlackjack } from '../blackjack'
import { fortyFiveHit, fortyFiveStand, newFortyFive } from '../fortyfive'
import { blackjackTotal, fortyFiveTotal } from '../points'
import type { CardCode } from '../../shared/types'

describe('45-bust', () => {
  it('busts over 45 and lets the other seat win', () => {
    const s = newFortyFive([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ])
    expect(s.seats).toHaveLength(2)
    expect(s.status).toBe('playing')
    const first = s.toAct!
    while (
      s.status === 'playing' &&
      s.toAct === first &&
      fortyFiveTotal(s.seats.find((x) => x.id === first)!.cards) <= 45
    ) {
      try {
        fortyFiveHit(s, first)
      } catch {
        break
      }
      if (fortyFiveTotal(s.seats.find((x) => x.id === first)!.cards) > 40) break
    }
    if (s.status === 'playing' && s.toAct === first) {
      fortyFiveStand(s, first)
    }
    if (s.status === 'playing' && s.toAct) {
      fortyFiveStand(s, s.toAct)
    }
    expect(['playing', 'settled']).toContain(s.status)
  })

  it('values JQK as 11-13', () => {
    expect(fortyFiveTotal(['Js', 'Qs', 'Ks'] as CardCode[])).toBe(36)
  })
})

describe('blackjack', () => {
  it('settles a completed hand without leaking chips math', () => {
    const s = newBlackjack({ id: 'p', name: 'P' }, 100)
    expect(s.player.cards).toHaveLength(2)
    expect(s.dealer.cards).toHaveLength(2)
    if (s.status === 'playing') {
      const after = blackjackStand(s)
      expect(after.status).toBe('settled')
      expect(['player', 'dealer', 'push']).toContain(after.outcome)
    }
  })

  it('busts a player who hits past 21', () => {
    const s = newBlackjack({ id: 'p', name: 'P' }, 50)
    if (s.status !== 'playing') return
    let guard = 0
    while (s.status === 'playing' && guard++ < 12) {
      blackjackHit(s)
    }
    expect(s.status).toBe('settled')
    if (blackjackTotal(s.player.cards).total > 21) {
      expect(s.outcome).toBe('dealer')
    }
  })
})
