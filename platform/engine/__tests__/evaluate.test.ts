import { describe, expect, it } from 'vitest'
import { getScore } from '../evaluate'
import type { CardCode } from '../../shared/types'

const C = (...cards: string[]) => cards as CardCode[]

describe('getScore bitmask evaluator', () => {
  it('ranks royal flush above straight flush', () => {
    const royal = getScore(C('As', 'Ks', 'Qs', 'Js', 'Ts', '2d', '3c'))
    const sf = getScore(C('9s', 'Ks', 'Qs', 'Js', 'Ts', '2d', '3c'))
    expect(royal.category).toBe('royal-flush')
    expect(sf.category).toBe('straight-flush')
    expect(royal.value).toBeGreaterThan(sf.value)
  })

  it('detects wheel straight A-2-3-4-5', () => {
    const wheel = getScore(C('As', '2d', '3c', '4h', '5s', 'Kd', 'Qc'))
    expect(wheel.category).toBe('straight')
    const sixHigh = getScore(C('2s', '3d', '4c', '5h', '6s', 'Kd', 'Qc'))
    expect(sixHigh.value).toBeGreaterThan(wheel.value)
  })

  it('ranks quads > full house > flush > straight', () => {
    const quads = getScore(C('Ah', 'Ad', 'Ac', 'As', '2d', '3c', '9h'))
    const boat = getScore(C('Ah', 'Ad', 'Ac', '2s', '2d', '3c', '9h'))
    const flush = getScore(C('Ah', 'Kh', '8h', '4h', '2h', '3c', '9d'))
    const straight = getScore(C('9h', 'Td', 'Jc', 'Qs', 'Kh', '2c', '3d'))
    expect(quads.category).toBe('four-of-a-kind')
    expect(boat.category).toBe('full-house')
    expect(flush.category).toBe('flush')
    expect(straight.category).toBe('straight')
    expect(quads.value).toBeGreaterThan(boat.value)
    expect(boat.value).toBeGreaterThan(flush.value)
    expect(flush.value).toBeGreaterThan(straight.value)
  })

  it('compares kickers on pairs', () => {
    const aceKicker = getScore(C('2h', '2d', 'Ah', 'Kd', 'Qc', '7s', '5c'))
    const kingKicker = getScore(C('2h', '2d', 'Kh', 'Qd', 'Jc', '7s', '5c'))
    expect(aceKicker.category).toBe('pair')
    expect(aceKicker.value).toBeGreaterThan(kingKicker.value)
  })
})
