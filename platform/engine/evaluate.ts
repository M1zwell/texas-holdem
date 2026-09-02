import type { CardCode, HandCategory } from '../shared/types'
import { RANKS, cardsMask } from './cards'

export interface HandScore {
  category: HandCategory
  /** Packed integer: category in high bits, then kickers. Larger wins. */
  value: number
  name: string
  best: CardCode[]
}

const CATEGORY_RANK: Record<HandCategory, number> = {
  'high-card': 0,
  pair: 1,
  'two-pair': 2,
  'three-of-a-kind': 3,
  straight: 4,
  flush: 5,
  'full-house': 6,
  'four-of-a-kind': 7,
  'straight-flush': 8,
  'royal-flush': 8,
}

const CATEGORY_NAME: Record<HandCategory, string> = {
  'high-card': 'High Card',
  pair: 'Pair',
  'two-pair': 'Two Pair',
  'three-of-a-kind': 'Three of a Kind',
  straight: 'Straight',
  flush: 'Flush',
  'full-house': 'Full House',
  'four-of-a-kind': 'Four of a Kind',
  'straight-flush': 'Straight Flush',
  'royal-flush': 'Royal Flush',
}

function popcount13(bits: number): number {
  let n = bits & 0x1fff
  n = n - ((n >>> 1) & 0x1555)
  n = (n & 0x1333) + ((n >>> 2) & 0x1333)
  n = (n + (n >>> 4)) & 0x0f0f
  return (n + (n >>> 8)) & 0x1f
}

/** Highest rank (2=0 … A=12) that completes a 5-straight, or -1. Wheel = 3 (5-high). */
export function straightHigh(ranks: number): number {
  const bits = ranks & 0x1fff
  if ((bits & 0x100f) === 0x100f) {
    return 3
  }
  for (let high = 12; high >= 4; high--) {
    const mask = 0x1f << (high - 4)
    if ((bits & mask) === mask) {
      return high
    }
  }
  return -1
}

function topRanks(bits: number, count: number): number[] {
  const out: number[] = []
  for (let r = 12; r >= 0 && out.length < count; r--) {
    if (bits & (1 << r)) {
      out.push(r)
    }
  }
  return out
}

function pack(category: HandCategory, kickers: number[]): number {
  let value = CATEGORY_RANK[category] << 24
  let shift = 20
  for (const k of kickers) {
    value |= (k & 0xf) << shift
    shift -= 4
  }
  return value
}

function ranksFromMask(mask: bigint): { bySuit: number[]; all: number; counts: number[] } {
  const bySuit = [0, 0, 0, 0]
  for (let s = 0; s < 4; s++) {
    bySuit[s] = Number((mask >> BigInt(s * 13)) & 0x1fffn)
  }
  const all = bySuit[0]! | bySuit[1]! | bySuit[2]! | bySuit[3]!
  const counts = new Array<number>(13).fill(0)
  for (let r = 0; r < 13; r++) {
    let n = 0
    for (let s = 0; s < 4; s++) {
      if (bySuit[s]! & (1 << r)) {
        n++
      }
    }
    counts[r] = n
  }
  return { bySuit, all, counts }
}

function cardsOfRanks(mask: bigint, ranksWanted: number[], flushSuit = -1): CardCode[] {
  const cards: CardCode[] = []
  for (const rank of ranksWanted) {
    for (let s = 0; s < 4; s++) {
      if (flushSuit >= 0 && s !== flushSuit) {
        continue
      }
      const bit = 1n << BigInt(s * 13 + rank)
      if ((mask & bit) !== 0n) {
        cards.push(`${RANKS[rank]}${['s', 'h', 'd', 'c'][s]}` as CardCode)
        break
      }
    }
  }
  return cards
}

/**
 * Absolute 5-to-7 card score via 64-bit masks (GPU-friendly: no object graphs).
 * Branch-light enough to run in Monte Carlo inner loops.
 */
export function getScore(cards: readonly CardCode[]): HandScore {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards')
  }
  const mask = cardsMask(cards)
  const { bySuit, all, counts } = ranksFromMask(mask)

  let flushSuit = -1
  let flushBits = 0
  for (let s = 0; s < 4; s++) {
    if (popcount13(bySuit[s]!) >= 5) {
      flushSuit = s
      flushBits = bySuit[s]!
      break
    }
  }

  if (flushSuit >= 0) {
    const sf = straightHigh(flushBits)
    if (sf >= 0) {
      const category: HandCategory = sf === 12 ? 'royal-flush' : 'straight-flush'
      const seq = sf === 3 ? [3, 2, 1, 0, 12] : [sf, sf - 1, sf - 2, sf - 3, sf - 4]
      return {
        category,
        value: pack('straight-flush', [sf]),
        name: CATEGORY_NAME[category],
        best: cardsOfRanks(mask, seq, flushSuit),
      }
    }
  }

  const quads: number[] = []
  const trips: number[] = []
  const pairs: number[] = []
  const singles: number[] = []
  for (let r = 12; r >= 0; r--) {
    const n = counts[r]!
    if (n === 4) quads.push(r)
    else if (n === 3) trips.push(r)
    else if (n === 2) pairs.push(r)
    else if (n === 1) singles.push(r)
  }

  if (quads.length) {
    const quad = quads[0]!
    const kicker = [...trips, ...pairs, ...singles][0]!
    return {
      category: 'four-of-a-kind',
      value: pack('four-of-a-kind', [quad, kicker]),
      name: CATEGORY_NAME['four-of-a-kind'],
      best: cardsOfRanks(mask, [quad, quad, quad, quad, kicker]),
    }
  }

  if (trips.length && (pairs.length || trips.length > 1)) {
    const three = trips[0]!
    const two = pairs[0] ?? trips[1]!
    return {
      category: 'full-house',
      value: pack('full-house', [three, two]),
      name: CATEGORY_NAME['full-house'],
      best: cardsOfRanks(mask, [three, three, three, two, two]),
    }
  }

  if (flushSuit >= 0) {
    const kickers = topRanks(flushBits, 5)
    return {
      category: 'flush',
      value: pack('flush', kickers),
      name: CATEGORY_NAME.flush,
      best: cardsOfRanks(mask, kickers, flushSuit),
    }
  }

  const sh = straightHigh(all)
  if (sh >= 0) {
    const seq = sh === 3 ? [3, 2, 1, 0, 12] : [sh, sh - 1, sh - 2, sh - 3, sh - 4]
    return {
      category: 'straight',
      value: pack('straight', [sh]),
      name: CATEGORY_NAME.straight,
      best: cardsOfRanks(mask, seq),
    }
  }

  if (trips.length) {
    const three = trips[0]!
    const kickers = singles.slice(0, 2)
    return {
      category: 'three-of-a-kind',
      value: pack('three-of-a-kind', [three, ...kickers]),
      name: CATEGORY_NAME['three-of-a-kind'],
      best: cardsOfRanks(mask, [three, three, three, ...kickers]),
    }
  }

  if (pairs.length >= 2) {
    const [hi, lo] = pairs
    const kicker = singles[0] ?? pairs[2] ?? 0
    return {
      category: 'two-pair',
      value: pack('two-pair', [hi!, lo!, kicker]),
      name: CATEGORY_NAME['two-pair'],
      best: cardsOfRanks(mask, [hi!, hi!, lo!, lo!, kicker]),
    }
  }

  if (pairs.length === 1) {
    const p = pairs[0]!
    const kickers = singles.slice(0, 3)
    return {
      category: 'pair',
      value: pack('pair', [p, ...kickers]),
      name: CATEGORY_NAME.pair,
      best: cardsOfRanks(mask, [p, p, ...kickers]),
    }
  }

  const kickers = topRanks(all, 5)
  return {
    category: 'high-card',
    value: pack('high-card', kickers),
    name: CATEGORY_NAME['high-card'],
    best: cardsOfRanks(mask, kickers),
  }
}

export function compareScores(a: HandScore, b: HandScore): number {
  return a.value - b.value
}
