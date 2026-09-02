import { randomInt } from 'node:crypto'
import type { CardCode, ClientAction, Street } from '../shared/types'
import type { Seat } from './holdem'
import { estimateEquity } from './montecarlo'

/** 10-dim state from Wang et al.: bias, P(win), P(tie), stack, pot, toCall, ΔoppWin, ΔoppBet, foldFreq, avgBet. */
export type StateVector = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export type Theta = number[] // 80 = 4 streets × (classifier 10 + regressor 10)

const STREET_INDEX: Record<Street, number> = {
  preflop: 0,
  flop: 1,
  turn: 2,
  river: 3,
}

export function randomTheta(scale = 200): Theta {
  return Array.from({ length: 80 }, () => (Math.random() * 2 - 1) * scale)
}

export function encodeState(args: {
  street: Street
  hole: [CardCode, CardCode]
  board: CardCode[]
  chips: number
  pot: number
  toCall: number
  cashCap: number
}): StateVector {
  const samples = args.street === 'preflop' ? 400 : 250
  const equity = estimateEquity(args.hole, args.board, samples, 1)
  return [
    1,
    equity.win,
    equity.tie,
    args.chips / args.cashCap,
    args.pot / args.cashCap,
    args.toCall / args.cashCap,
    0,
    0,
    0.2,
    0.1,
  ]
}

export function decideFromTheta(
  theta: Theta,
  street: Street,
  state: StateVector,
  legal: ClientAction[],
  cashCap: number,
): ClientAction {
  const i = STREET_INDEX[street]
  const c = theta.slice(i * 20, i * 20 + 10)
  const r = theta.slice(i * 20 + 10, i * 20 + 20)
  const foldScore = dot(c, state)
  if (foldScore < 0) {
    return legal.find((a) => a.type === 'fold') ?? legal[0]!
  }
  const raw = dot(r, state) * cashCap
  const raise = legal.find((a) => a.type === 'raise' || a.type === 'bet')
  const call = legal.find((a) => a.type === 'call')
  const check = legal.find((a) => a.type === 'check')
  if (raise && raw > (raise.amount ?? 0)) {
    return { type: raise.type, amount: raise.amount }
  }
  if (call) return call
  if (check) return check
  return legal[0]!
}

function dot(a: number[], b: StateVector): number {
  let s = 0
  for (let i = 0; i < 10; i++) s += (a[i] ?? 0) * b[i]!
  return s
}

export function crossover(a: Theta, b: Theta): Theta {
  const point = randomInt(a.length)
  return a.map((v, i) => (i < point ? v : b[i]!))
}

export function mutate(theta: Theta, p = 5e-4, scale = 40): Theta {
  return theta.map((v) => (Math.random() < p ? v + (Math.random() * 2 - 1) * scale : v))
}

export function selectIndex(ranks: number[]): number {
  const weights = ranks.map((r) => Math.exp(-0.1 * r))
  const total = weights.reduce((s, w) => s + w, 0)
  let roll = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]!
    if (roll <= 0) return i
  }
  return ranks.length - 1
}

export function botAction(args: {
  street: Street
  seat: Seat
  board: CardCode[]
  pot: number
  toCall: number
  legal: ClientAction[]
  theta?: Theta
  cashCap: number
}): ClientAction {
  if (!args.seat.hole || !args.legal.length) {
    return { type: 'fold' }
  }
  const theta = args.theta ?? DEFAULT_THETA
  const state = encodeState({
    street: args.street,
    hole: args.seat.hole,
    board: args.board,
    chips: args.seat.chips,
    pot: args.pot,
    toCall: args.toCall,
    cashCap: args.cashCap,
  })
  return decideFromTheta(theta, args.street, state, args.legal, args.cashCap)
}

/** Tight-ish default genome: fold junk, call/bet when equity is real. */
export const DEFAULT_THETA: Theta = (() => {
  const t = new Array<number>(80).fill(0)
  for (let s = 0; s < 4; s++) {
    t[s * 20 + 0] = -0.15
    t[s * 20 + 1] = 1.2
    t[s * 20 + 2] = 0.4
    t[s * 20 + 5] = -0.3
    t[s * 20 + 10] = 0.05
    t[s * 20 + 11] = 0.8
  }
  return t
})()
