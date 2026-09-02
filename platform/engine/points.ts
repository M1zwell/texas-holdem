import type { CardCode } from '../shared/types'

/** Pip for 45-bust: A=1, J=11, Q=12, K=13. */
export function fortyFivePip(card: CardCode): number {
  const r = card[0]
  if (r === 'A') return 1
  if (r === 'T') return 10
  if (r === 'J') return 11
  if (r === 'Q') return 12
  if (r === 'K') return 13
  return Number(r)
}

export function fortyFiveTotal(cards: readonly CardCode[]): number {
  return cards.reduce((s, c) => s + fortyFivePip(c), 0)
}

/** Blackjack: A=1/11, faces=10. Soft ace counted as 11 when it does not bust. */
export function blackjackTotal(cards: readonly CardCode[]): { total: number; soft: boolean } {
  let total = 0
  let aces = 0
  for (const card of cards) {
    const r = card[0]
    if (r === 'A') {
      aces += 1
      total += 1
    } else if (r === 'T' || r === 'J' || r === 'Q' || r === 'K') {
      total += 10
    } else {
      total += Number(r)
    }
  }
  let soft = false
  if (aces > 0 && total + 10 <= 21) {
    total += 10
    soft = true
  }
  return { total, soft }
}

export type DrawStatus = 'playing' | 'stand' | 'bust' | 'blackjack'

export interface DrawSeat {
  id: string
  name: string
  cards: CardCode[]
  status: DrawStatus
  isBot: boolean
}

export interface FortyFiveState {
  seats: DrawSeat[]
  toAct: string | null
  deck: CardCode[]
  pot: number
  status: 'waiting' | 'playing' | 'settled'
  winners: { id: string; total: number; amount: number }[]
}

export interface BlackjackState {
  player: DrawSeat
  dealer: DrawSeat
  deck: CardCode[]
  pot: number
  bet: number
  status: 'betting' | 'playing' | 'settled'
  outcome: 'player' | 'dealer' | 'push' | null
}
