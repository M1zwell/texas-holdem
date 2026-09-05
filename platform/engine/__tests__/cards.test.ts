import { describe, expect, it } from 'vitest'
import { fullDeck, seededShoe, seededShuffle } from '../cards'

describe('seededShuffle', () => {
  it('is a pure function of the seed — the same seed deals the same deck anywhere', () => {
    // This is the whole point: two Worker isolates dealing hand N must agree.
    const a = seededShoe('hmac-of-secret-and-hand-7')
    const b = seededShoe('hmac-of-secret-and-hand-7')
    expect(a).toEqual(b)
  })

  it('is a permutation — 52 distinct cards, nothing lost, nothing doubled', () => {
    const shoe = seededShoe('any-seed')
    expect(shoe).toHaveLength(52)
    expect(new Set(shoe).size).toBe(52)
    expect([...shoe].sort()).toEqual([...fullDeck()].sort())
  })

  it('different seeds deal different decks — the seed actually drives the order', () => {
    const a = seededShoe('hand-1')
    const b = seededShoe('hand-2')
    expect(a).not.toEqual(b)
    // And it is not a trivial rotation of the unshuffled deck.
    expect(a).not.toEqual(fullDeck())
  })

  it('does not mutate its input', () => {
    const items = [1, 2, 3, 4, 5]
    const snapshot = [...items]
    seededShuffle(items, 'x')
    expect(items).toEqual(snapshot)
  })
})
