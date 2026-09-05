/**
 * Pure view-model helpers for the Hold'em felt.
 *
 * These exist because the table was quietly lying about the hand in four ways,
 * and each lie is a one-line calculation that belongs somewhere testable:
 *
 *  - the pot excluded the current street's bets, so it read 0 with blinds up;
 *  - `raise` carries the INCREMENT, but the button printed it as if it were the
 *    total, so "raise 100" meant "raise to 200";
 *  - winners were labelled with a slice of their id ("bot-"), not their name;
 *  - the board was a flat row, with no flop / turn / river structure.
 */
import type { CardCode, ClientAction, PublicHoldemState, PublicPlayer } from '@shared/types'

/**
 * Chips actually at stake right now: the collected pot PLUS everything wagered
 * on the current street.
 *
 * The engine only sweeps bets into `pot` when a street ends (`collectBets`), so
 * mid-street `state.pot` is the pot as of the LAST street. Preflop that means it
 * reads 0 while the blinds sit in front of the seats. Every poker client shows
 * the live total, and pot odds are meaningless without it.
 */
export function livePot(state: Pick<PublicHoldemState, 'pot' | 'players'>): number {
  return state.pot + state.players.reduce((n, p) => n + p.bet, 0)
}

/** What the acting player must put in to stay in the hand. */
export function toCall(state: Pick<PublicHoldemState, 'currentBet'>, seat?: PublicPlayer): number {
  if (!seat) return 0
  return Math.max(0, state.currentBet - seat.bet)
}

/**
 * Pot odds as a percentage: what share of the resulting pot the call costs.
 * Null when there is nothing to call — free cards have no price.
 */
export function potOddsPct(
  state: Pick<PublicHoldemState, 'pot' | 'players' | 'currentBet'>,
  seat?: PublicPlayer,
): number | null {
  const call = toCall(state, seat)
  if (call <= 0) return null
  return (call / (livePot(state) + call)) * 100
}

/**
 * The board, split the way it is dealt. Anything beyond five cards is a bug
 * upstream of here, so it is surfaced rather than hidden.
 */
export function boardStreets(board: readonly CardCode[]): {
  flop: CardCode[]
  turn: CardCode[]
  river: CardCode[]
  extra: CardCode[]
} {
  return {
    flop: board.slice(0, 3),
    turn: board.slice(3, 4),
    river: board.slice(4, 5),
    extra: board.slice(5),
  }
}

const STREET_LABEL: Record<string, string> = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

/** "River", not "river"; and something honest when no hand is running. */
export function streetLabel(state: Pick<PublicHoldemState, 'street' | 'status'>): string {
  if (state.status === 'handOver' || state.status === 'showdown') return 'Showdown'
  if (!state.street) return 'Waiting for the deal'
  return STREET_LABEL[state.street] ?? state.street
}

/** 1234567 → "1,234,567". Stacks are unreadable without it. */
export function chips(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/**
 * A button label a poker player can act on without translating it.
 *
 * The important case is `raise`: the engine's `amount` is the increment ON TOP
 * of the current bet, so the total a raise commits to is `currentBet + amount`.
 * Quoting the increment — as this used to — reads as a much smaller raise than
 * it is. Raises are quoted as raise-TO everywhere else in poker, so they are
 * here too.
 */
export function actionLabel(
  action: ClientAction,
  state: Pick<PublicHoldemState, 'currentBet'>,
): string {
  switch (action.type) {
    case 'fold':
      return 'Fold'
    case 'check':
      return 'Check'
    case 'call':
      return action.amount != null ? `Call ${chips(action.amount)}` : 'Call'
    case 'bet':
      return action.amount != null ? `Bet ${chips(action.amount)}` : 'Bet'
    case 'raise':
      return action.amount != null ? `Raise to ${chips(state.currentBet + action.amount)}` : 'Raise'
    case 'allin':
      return action.amount != null ? `All-in ${chips(action.amount)}` : 'All-in'
    default:
      return action.type
  }
}

/**
 * Winners named as people, with what they won and how.
 *
 * The felt used to print `w.id.slice(0, 4)`, which renders every bot as "bot-"
 * and a human as a UUID fragment. A seat that has since left the table has no
 * name to find, so say that rather than showing a raw id.
 */
export function winnerLines(state: Pick<PublicHoldemState, 'winners' | 'players'>): string[] {
  return (state.winners ?? []).map((w) => {
    const name = state.players.find((p) => p.id === w.id)?.name ?? 'A player who left'
    const how = w.handName ? ` · ${w.handName}` : ''
    return `${name} +${chips(w.amount)}${how}`
  })
}

/** Side pots are only worth showing once a player is all-in and one exists. */
export function sidePots(state: Pick<PublicHoldemState, 'pots'>): { amount: number; n: number }[] {
  if (!state.pots || state.pots.length < 2) return []
  return state.pots.map((p, i) => ({ amount: p.amount, n: i }))
}
