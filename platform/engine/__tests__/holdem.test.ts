import { describe, expect, it } from 'vitest'
import { HoldemTable } from '../holdem'

function twoSeatTable(): HoldemTable {
  const t = new HoldemTable({ smallBlind: 50, bigBlind: 100, startingChips: 1000 })
  t.sit('a', 'Alice')
  t.sit('b', 'Bob')
  return t
}

describe('HoldemTable', () => {
  it('posts blinds and deals two hole cards', () => {
    const t = twoSeatTable()
    t.startHand()
    expect(t.status).toBe('playing')
    expect(t.street).toBe('preflop')
    expect(t.seats[0]!.hole).toHaveLength(2)
    expect(t.seats[1]!.hole).toHaveLength(2)
    const bets = t.seats.map((s) => s.bet).sort((x, y) => x - y)
    expect(bets).toEqual([50, 100])
    expect(t.toAct).toBeTruthy()
  })

  it('fold awards the pot to the remaining player', () => {
    const t = twoSeatTable()
    t.startHand()
    const actor = t.toAct!
    t.apply(actor, { type: 'fold' })
    expect(t.status).toBe('handOver')
    expect(t.winners.length).toBe(1)
    const total = t.seats.reduce((s, p) => s + p.chips, 0)
    expect(total).toBe(2000)
  })

  it('rejects out-of-turn actions', () => {
    const t = twoSeatTable()
    t.startHand()
    const other = t.seats.find((s) => s.id !== t.toAct)!.id
    expect(() => t.apply(other, { type: 'fold' })).toThrow(/Not your turn/)
  })

  it('check-check through streets reaches showdown', () => {
    const t = new HoldemTable({ smallBlind: 50, bigBlind: 100, startingChips: 5000 })
    t.sit('a', 'Alice')
    t.sit('b', 'Bob')
    t.startHand()
    let guard = 0
    while (t.status === 'playing' && guard++ < 40) {
      const id = t.toAct!
      const legal = t.legalActions(id)
      const move =
        legal.find((a) => a.type === 'check') ?? legal.find((a) => a.type === 'call') ?? legal[0]!
      t.apply(id, move)
    }
    expect(['showdown', 'handOver']).toContain(t.status)
    expect(t.board.length).toBeGreaterThanOrEqual(0)
    const total = t.seats.reduce((s, p) => s + p.chips, 0)
    expect(total).toBe(10000)
  })

  it('preserves chips across side-pot all-in', () => {
    const t = new HoldemTable({ smallBlind: 50, bigBlind: 100, startingChips: 300 })
    t.sit('short', 'Short', 150)
    t.sit('mid', 'Mid', 300)
    t.sit('deep', 'Deep', 600)
    t.startHand()
    let guard = 0
    while (t.status === 'playing' && guard++ < 60) {
      const id = t.toAct!
      const legal = t.legalActions(id)
      const allin = legal.find((a) => a.type === 'allin')
      t.apply(id, allin ?? legal.find((a) => a.type === 'call') ?? legal[0]!)
    }
    const total = t.seats.reduce((s, p) => s + p.chips + p.bet, 0)
    expect(total).toBe(1050)
    expect(t.status).toBe('handOver')
  })
})
