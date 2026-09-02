import type { CardCode } from '../shared/types'
import { freshShoe } from './cards'

export type BaccaratBetSeat = 'player' | 'banker' | 'tie'

export interface BaccaratBet {
  playerId: string
  seat: BaccaratBetSeat
  amount: number
}

export interface BaccaratResult {
  playerCards: CardCode[]
  bankerCards: CardCode[]
  playerTotal: number
  bankerTotal: number
  winner: 'player' | 'banker' | 'tie'
  payouts: Record<string, number>
}

export function baccaratValue(card: CardCode): number {
  const rank = card[0]
  if (rank === 'A') return 1
  if (rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K') return 0
  return Number(rank)
}

export function baccaratTotal(cards: readonly CardCode[]): number {
  return cards.reduce((sum, card) => sum + baccaratValue(card), 0) % 10
}

/**
 * Standard baccarat tableau (player/banker third-card rules).
 * House edge is encoded in 0.95 banker payout — no extra commission chip.
 */
export function resolveBaccarat(
  shoe: CardCode[],
  bets: BaccaratBet[],
): { result: BaccaratResult; shoe: CardCode[] } {
  const next = shoe.slice()
  const draw = (): CardCode => {
    const card = next.shift()
    if (!card) {
      throw new Error('Shoe empty')
    }
    return card
  }

  const playerCards = [draw(), draw()]
  const bankerCards = [draw(), draw()]
  let playerTotal = baccaratTotal(playerCards)
  let bankerTotal = baccaratTotal(bankerCards)

  const natural = playerTotal >= 8 || bankerTotal >= 8
  if (!natural) {
    let playerThird: CardCode | undefined
    if (playerTotal <= 5) {
      playerThird = draw()
      playerCards.push(playerThird)
      playerTotal = baccaratTotal(playerCards)
    }
    const bankerDraws = shouldBankerDraw(bankerTotal, playerThird)
    if (bankerDraws) {
      bankerCards.push(draw())
      bankerTotal = baccaratTotal(bankerCards)
    }
  }

  const winner: BaccaratResult['winner'] =
    playerTotal > bankerTotal ? 'player' : bankerTotal > playerTotal ? 'banker' : 'tie'

  const payouts: Record<string, number> = {}
  for (const bet of bets) {
    let delta = -bet.amount
    if (winner === 'tie') {
      if (bet.seat === 'tie') {
        delta = bet.amount * 8
      } else {
        delta = 0
      }
    } else if (bet.seat === winner) {
      delta = winner === 'banker' ? Math.floor(bet.amount * 0.95) : bet.amount
    }
    payouts[bet.playerId] = (payouts[bet.playerId] ?? 0) + delta
  }

  return {
    shoe: next,
    result: { playerCards, bankerCards, playerTotal, bankerTotal, winner, payouts },
  }
}

export function shouldBankerDraw(bankerTotal: number, playerThird?: CardCode): boolean {
  if (playerThird === undefined) {
    return bankerTotal <= 5
  }
  const v = baccaratValue(playerThird)
  switch (bankerTotal) {
    case 0:
    case 1:
    case 2:
      return true
    case 3:
      return v !== 8
    case 4:
      return v >= 2 && v <= 7
    case 5:
      return v >= 4 && v <= 7
    case 6:
      return v === 6 || v === 7
    default:
      return false
  }
}

export function newBaccaratShoe(): CardCode[] {
  return freshShoe(8)
}
