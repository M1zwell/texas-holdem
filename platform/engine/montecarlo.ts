import type { CardCode } from '../shared/types'
import { fullDeck, shuffle } from './cards'
import { getScore } from './evaluate'

export interface Equity {
  win: number
  tie: number
  lose: number
  samples: number
}

/**
 * Monte Carlo win/tie/lose vs one random opponent.
 * Preflop: 2500 samples ≈ two significant digits (CLT), matching the GA paper.
 */
export function estimateEquity(
  hole: readonly CardCode[],
  board: readonly CardCode[] = [],
  samples = 2500,
  opponents = 1,
): Equity {
  const used = new Set([...hole, ...board])
  const remaining = fullDeck().filter((c) => !used.has(c))
  const needBoard = 5 - board.length
  const needOpp = opponents * 2
  let win = 0
  let tie = 0
  let lose = 0

  for (let i = 0; i < samples; i++) {
    const draw = shuffle(remaining)
    const oppHoles: CardCode[][] = []
    let offset = 0
    for (let o = 0; o < opponents; o++) {
      oppHoles.push([draw[offset]!, draw[offset + 1]!])
      offset += 2
    }
    const restBoard = draw.slice(needOpp, needOpp + needBoard)
    const fullBoard = [...board, ...restBoard]
    const hero = getScore([...hole, ...fullBoard]).value
    let bestOpp = -Infinity
    for (const opp of oppHoles) {
      bestOpp = Math.max(bestOpp, getScore([...opp, ...fullBoard]).value)
    }
    if (hero > bestOpp) win += 1
    else if (hero === bestOpp) tie += 1
    else lose += 1
  }

  const n = samples || 1
  return { win: win / n, tie: tie / n, lose: lose / n, samples }
}
