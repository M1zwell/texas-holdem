import { createHash, randomInt } from 'node:crypto'
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

/**
 * Deterministic Fisher–Yates driven by SHA-256(seed ‖ counter). Same seed, same
 * order — on every machine, in every Worker isolate.
 *
 * WHY THIS EXISTS. On a serverless host the room is re-created per request and
 * the next hand is dealt by whichever isolate happens to answer the poll that
 * notices the hand is over. With `freshShoe()` two isolates dealt two DIFFERENT
 * hands for the same handId and both persisted them, so a player's polls
 * alternated between two forks of the table — the "cards flashing" bug. Seeding
 * the shuffle from a per-room secret makes the deal a pure function of the
 * persisted state, so every isolate deals the same cards.
 *
 * The seed is HMAC(roomSecret, handId), never the handId alone: the secret is
 * 256 bits, server-side only, and never leaves the snapshot, so a deck stays as
 * unpredictable to a player as the crypto shuffle was. Rejection sampling keeps
 * the draw unbiased; a 32-bit modulo would not be.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = items.slice()
  let counter = 0
  let pool: Buffer = Buffer.alloc(0)
  let offset = 0
  const next32 = (): number => {
    if (offset + 4 > pool.length) {
      pool = createHash('sha256').update(seed).update(':').update(String(counter++)).digest()
      offset = 0
    }
    const v = pool.readUInt32BE(offset)
    offset += 4
    return v
  }
  for (let i = copy.length - 1; i > 0; i--) {
    const n = i + 1
    const limit = Math.floor(0x1_0000_0000 / n) * n
    let r = next32()
    while (r >= limit) r = next32()
    const j = r % n
    const tmp = copy[i]
    copy[i] = copy[j]!
    copy[j] = tmp!
  }
  return copy
}

/** A shoe whose order is fixed by `seed` — see `seededShuffle`. */
export function seededShoe(seed: string, decks = 1): CardCode[] {
  const shoe: CardCode[] = []
  for (let i = 0; i < decks; i++) {
    shoe.push(...fullDeck())
  }
  return seededShuffle(shoe, seed)
}

export function unicodeCard(card: CardCode): string {
  const suitMark: Record<SuitChar, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }
  const rank = card[0] === 'T' ? '10' : card[0]
  return `${rank}${suitMark[card[1] as SuitChar]}`
}

export function isRed(card: CardCode): boolean {
  return card[1] === 'h' || card[1] === 'd'
}
