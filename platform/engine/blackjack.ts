import { freshShoe } from './cards'
import { blackjackTotal, type BlackjackState, type DrawSeat } from './points'

export function newBlackjack(player: { id: string; name: string }, bet: number): BlackjackState {
  const deck = freshShoe(1)
  const p: DrawSeat = {
    id: player.id,
    name: player.name,
    cards: [deck.shift()!, deck.shift()!],
    status: 'playing',
    isBot: false,
  }
  const dealer: DrawSeat = {
    id: 'dealer',
    name: 'Dealer',
    cards: [deck.shift()!, deck.shift()!],
    status: 'playing',
    isBot: true,
  }
  const pt = blackjackTotal(p.cards)
  const dt = blackjackTotal(dealer.cards)
  const state: BlackjackState = {
    player: p,
    dealer,
    deck,
    pot: bet,
    bet,
    status: 'playing',
    outcome: null,
  }
  if (pt.total === 21 && dt.total === 21) {
    return finish(state, 'push')
  }
  if (pt.total === 21) {
    p.status = 'blackjack'
    return finish(state, 'player')
  }
  if (dt.total === 21) {
    dealer.status = 'blackjack'
    return finish(state, 'dealer')
  }
  return state
}

export function blackjackHit(state: BlackjackState): BlackjackState {
  if (state.status !== 'playing' || state.player.status !== 'playing') {
    throw new Error('Cannot hit')
  }
  state.player.cards.push(state.deck.shift()!)
  const { total } = blackjackTotal(state.player.cards)
  if (total > 21) {
    state.player.status = 'bust'
    return finish(state, 'dealer')
  }
  if (total === 21) {
    return blackjackStand(state)
  }
  return state
}

export function blackjackStand(state: BlackjackState): BlackjackState {
  if (state.status !== 'playing') {
    throw new Error('Round over')
  }
  state.player.status = 'stand'
  playDealer(state)
  const p = blackjackTotal(state.player.cards).total
  const d = blackjackTotal(state.dealer.cards).total
  if (state.dealer.status === 'bust') return finish(state, 'player')
  if (p > d) return finish(state, 'player')
  if (p < d) return finish(state, 'dealer')
  return finish(state, 'push')
}

function playDealer(state: BlackjackState): void {
  while (true) {
    const { total } = blackjackTotal(state.dealer.cards)
    if (total > 21) {
      state.dealer.status = 'bust'
      return
    }
    if (total >= 17) {
      state.dealer.status = 'stand'
      return
    }
    state.dealer.cards.push(state.deck.shift()!)
  }
}

function finish(
  state: BlackjackState,
  outcome: NonNullable<BlackjackState['outcome']>,
): BlackjackState {
  state.outcome = outcome
  state.status = 'settled'
  return state
}

export function blackjackPayout(
  bet: number,
  outcome: BlackjackState['outcome'],
  playerBj: boolean,
): number {
  if (outcome === 'push') return 0
  if (outcome === 'dealer') return -bet
  if (playerBj) return Math.floor(bet * 1.5)
  return bet
}
