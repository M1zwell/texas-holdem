import type { CardCode } from '../shared/types'
import { freshShoe } from './cards'
import { fortyFiveTotal, type DrawSeat, type FortyFiveState } from './points'

const TARGET = 45

export function newFortyFive(
  players: { id: string; name: string; isBot?: boolean }[],
): FortyFiveState {
  if (players.length < 2) {
    throw new Error('Need at least 2 players')
  }
  const deck = freshShoe(1)
  const seats: DrawSeat[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    cards: [deck.shift()!, deck.shift()!],
    status: 'playing',
    isBot: Boolean(p.isBot),
  }))
  for (const seat of seats) {
    if (fortyFiveTotal(seat.cards) > TARGET) {
      seat.status = 'bust'
    }
  }
  return {
    seats,
    toAct: nextActor(seats, null),
    deck,
    pot: 0,
    status: 'playing',
    winners: [],
  }
}

export function fortyFiveHit(state: FortyFiveState, playerId: string): FortyFiveState {
  const seat = requireActor(state, playerId)
  const card = state.deck.shift()
  if (!card) throw new Error('Deck empty')
  seat.cards.push(card)
  const total = fortyFiveTotal(seat.cards)
  if (total > TARGET) {
    seat.status = 'bust'
  }
  return advance(state, playerId)
}

export function fortyFiveStand(state: FortyFiveState, playerId: string): FortyFiveState {
  const seat = requireActor(state, playerId)
  seat.status = 'stand'
  return advance(state, playerId)
}

export function fortyFiveBotChoice(cards: CardCode[]): 'hit' | 'stand' {
  const t = fortyFiveTotal(cards)
  if (t >= 42) return 'stand'
  if (t <= 36) return 'hit'
  return t < 40 ? 'hit' : 'stand'
}

function requireActor(state: FortyFiveState, playerId: string): DrawSeat {
  if (state.status !== 'playing' || state.toAct !== playerId) {
    throw new Error('Not your turn')
  }
  const seat = state.seats.find((s) => s.id === playerId)
  if (!seat || seat.status !== 'playing') {
    throw new Error('Cannot act')
  }
  return seat
}

function nextActor(seats: DrawSeat[], fromId: string | null): string | null {
  const start = fromId ? seats.findIndex((s) => s.id === fromId) : -1
  for (let i = 1; i <= seats.length; i++) {
    const seat = seats[(start + i + seats.length) % seats.length]!
    if (seat.status === 'playing') return seat.id
  }
  return null
}

function advance(state: FortyFiveState, fromId: string): FortyFiveState {
  const next = nextActor(state.seats, fromId)
  state.toAct = next
  if (!next) {
    settle(state)
  }
  return state
}

function settle(state: FortyFiveState): void {
  const live = state.seats
    .filter((s) => s.status !== 'bust')
    .map((s) => ({ id: s.id, total: fortyFiveTotal(s.cards) }))
  if (!live.length) {
    state.winners = []
    state.status = 'settled'
    return
  }
  const best = live.reduce((m, s) => {
    const dm = TARGET - m.total
    const ds = TARGET - s.total
    return ds < dm ? s : m
  })
  const winners = live.filter((s) => TARGET - s.total === TARGET - best.total)
  const share = Math.floor((state.pot || 0) / Math.max(1, winners.length))
  state.winners = winners.map((w) => ({ id: w.id, total: w.total, amount: share }))
  state.status = 'settled'
  state.toAct = null
}
