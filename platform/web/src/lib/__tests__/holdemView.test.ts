import { describe, expect, it } from 'vitest'
import {
  actionLabel,
  boardStreets,
  chips,
  livePot,
  potOddsPct,
  streetLabel,
  toCall,
  winnerLines,
} from '../holdemView'
import type { CardCode, PublicHoldemState, PublicPlayer } from '@shared/types'

const seat = (over: Partial<PublicPlayer> = {}): PublicPlayer => ({
  id: 'p1',
  name: 'Ada',
  chips: 2000,
  bet: 0,
  folded: false,
  allIn: false,
  role: null,
  isBot: false,
  connected: true,
  ...over,
})

describe('livePot', () => {
  it('counts the blinds that are still in front of the seats', () => {
    // The engine sweeps bets into `pot` only when a street ENDS, so preflop the
    // collected pot is 0 while 150 is genuinely at stake. Showing 0 there is the
    // bug this function exists to kill.
    const state = { pot: 0, players: [seat({ bet: 50 }), seat({ id: 'p2', bet: 100 })] }
    expect(livePot(state)).toBe(150)
  })

  it('adds the current street to what earlier streets already collected', () => {
    const state = { pot: 400, players: [seat({ bet: 200 }), seat({ id: 'p2', bet: 200 })] }
    expect(livePot(state)).toBe(800)
  })

  it('equals the collected pot once bets are swept', () => {
    expect(livePot({ pot: 800, players: [seat(), seat({ id: 'p2' })] })).toBe(800)
  })
})

describe('toCall / potOddsPct', () => {
  it('is what the seat still owes, never negative', () => {
    expect(toCall({ currentBet: 100 }, seat({ bet: 50 }))).toBe(50)
    expect(toCall({ currentBet: 100 }, seat({ bet: 100 }))).toBe(0)
    expect(toCall({ currentBet: 0 }, seat({ bet: 100 }))).toBe(0)
  })

  it('prices the call against the pot it would create', () => {
    // 50 to call into a live pot of 150 → 50 / 200 = 25%.
    const state = {
      pot: 0,
      currentBet: 100,
      players: [seat({ bet: 50 }), seat({ id: 'p2', bet: 100 })],
    }
    expect(potOddsPct(state, seat({ bet: 50 }))).toBeCloseTo(25, 5)
  })

  it('is null when checking is free — a free card has no price', () => {
    const state = { pot: 300, currentBet: 0, players: [seat()] }
    expect(potOddsPct(state, seat())).toBeNull()
  })
})

describe('actionLabel', () => {
  it('quotes a raise as raise-TO, not as the increment', () => {
    // The engine's `raise.amount` is the extra ON TOP of currentBet. Printing it
    // raw read as "raise 100" when the player was committing to 200.
    expect(actionLabel({ type: 'raise', amount: 100 }, { currentBet: 100 })).toBe('Raise to 200')
    expect(actionLabel({ type: 'raise', amount: 400 }, { currentBet: 600 })).toBe('Raise to 1,000')
  })

  it('names the simple actions in poker English', () => {
    expect(actionLabel({ type: 'fold' }, { currentBet: 0 })).toBe('Fold')
    expect(actionLabel({ type: 'check' }, { currentBet: 0 })).toBe('Check')
    expect(actionLabel({ type: 'call', amount: 1500 }, { currentBet: 1500 })).toBe('Call 1,500')
    expect(actionLabel({ type: 'allin', amount: 2000 }, { currentBet: 100 })).toBe('All-in 2,000')
  })
})

describe('winnerLines', () => {
  it('names the winner instead of slicing their id', () => {
    // This is what produced "bot- +4000" on the live felt.
    const state = {
      winners: [{ id: 'bot-0', amount: 4000, handName: 'Three of a Kind' }],
      players: [seat({ id: 'bot-0', name: 'GA Bot 1', isBot: true })],
    }
    expect(winnerLines(state)).toEqual(['GA Bot 1 +4,000 · Three of a Kind'])
  })

  it('does not print a raw id for a seat that has left', () => {
    const state = { winners: [{ id: 'gone', amount: 100 }], players: [] }
    expect(winnerLines(state)).toEqual(['A player who left +100'])
  })
})

describe('boardStreets', () => {
  const C = (...c: string[]) => c as CardCode[]

  it('splits the board the way it was dealt', () => {
    const b = boardStreets(C('As', 'Kd', '2c', '7h', '9s'))
    expect(b.flop).toEqual(C('As', 'Kd', '2c'))
    expect(b.turn).toEqual(C('7h'))
    expect(b.river).toEqual(C('9s'))
    expect(b.extra).toEqual([])
  })

  it('is honest about a partial board', () => {
    const b = boardStreets(C('As', 'Kd', '2c'))
    expect(b.flop).toHaveLength(3)
    expect(b.turn).toEqual([])
    expect(b.river).toEqual([])
  })

  it('surfaces a sixth card rather than hiding it', () => {
    expect(boardStreets(C('As', 'Kd', '2c', '7h', '9s', '3d')).extra).toEqual(C('3d'))
  })
})

describe('streetLabel', () => {
  it('is capitalised prose, not the wire value', () => {
    expect(streetLabel({ street: 'preflop', status: 'playing' })).toBe('Pre-flop')
    expect(streetLabel({ street: 'river', status: 'playing' })).toBe('River')
  })

  it('says Showdown once the hand is decided, whatever street it ended on', () => {
    expect(streetLabel({ street: 'turn', status: 'handOver' })).toBe('Showdown')
    expect(streetLabel({ street: 'river', status: 'showdown' })).toBe('Showdown')
  })

  it('says what is happening when no hand is running', () => {
    expect(streetLabel({ street: null, status: 'waiting' })).toBe('Waiting for the deal')
  })
})

describe('chips', () => {
  it('groups thousands so a stack can be read at a glance', () => {
    expect(chips(2000)).toBe('2,000')
    expect(chips(1234567)).toBe('1,234,567')
    expect(chips(0)).toBe('0')
  })
})
