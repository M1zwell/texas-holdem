import { randomInt } from 'node:crypto'
import type { CardCode, RankChar, SuitChar } from '../shared/types'

export const RANKS: RankChar[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
export const SUITS: SuitChar[] = ['s', 'h', 'd', 'c']

/** 64-bit mask: suits occupy 13-bit lanes (2..A). Only the low 52 bits are used. */
export function cardBit(card: CardCode): bigint {
  const rank = RANKS.indexOf(card[0] as RankChar)
  const suit = SUITS.indexOf(card[1] as SuitChar)
  if (rank < 0 || suit < 0) {
    throw new Error(`Invalid card ${card}`)
  }
  return 1n << BigInt(suit * 13 + rank)
}

export function cardsMask(cards: readonly CardCode[]): bigint {
  return cards.reduce((mask, card) => mask | cardBit(card), 0n)
}

export function bitToCard(bitIndex: number): CardCode {
  const suit = SUITS[Math.floor(bitIndex / 13)]
  const rank = RANKS[bitIndex % 13]
  return `${rank}${suit}` as CardCode
}

export function maskToCards(mask: bigint): CardCode[] {
  const cards: CardCode[] = []
  for (let i = 0; i < 52; i++) {
    if ((mask & (1n << BigInt(i))) !== 0n) {
      cards.push(bitToCard(i))
    }
  }
  return cards
}

export function fullDeck(): CardCode[] {
  const deck: CardCode[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}` as CardCode)
    }
  }
  return deck
}

/** Cryptographic Fisher–Yates. Prefer this over Math.random for deal fairness. */
export function shuffle<T>(items: T[]): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const tmp = copy[i]
    copy[i] = copy[j]!
    copy[j] = tmp!
  }
  return copy
}

export function freshShoe(decks = 1): CardCode[] {
  const shoe: CardCode[] = []
  for (let i = 0; i < decks; i++) {
    shoe.push(...fullDeck())
  }
  return shuffle(shoe)
}

export function unicodeCard(card: CardCode): string {
  const suitMark: Record<SuitChar, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }
  const rank = card[0] === 'T' ? '10' : card[0]
  return `${rank}${suitMark[card[1] as SuitChar]}`
}

export function isRed(card: CardCode): boolean {
  return card[1] === 'h' || card[1] === 'd'
}
