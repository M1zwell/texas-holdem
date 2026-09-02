import { newBaccaratShoe, resolveBaccarat, type BaccaratBetSeat } from '../../engine/baccarat'
import type { CardCode, PublicBaccaratState } from '../../shared/types'
import type { Lobby } from '../store'
import { store } from '../store'
import { config } from '../config'

export interface BaccaratRoomSnap {
  kind: 'baccarat'
  shoe: CardCode[]
  bets: Array<[string, { seat: BaccaratBetSeat; amount: number }]>
  state: PublicBaccaratState
}

export class BaccaratRoom {
  shoe = newBaccaratShoe()
  bets = new Map<string, { seat: BaccaratBetSeat; amount: number }>()
  state: PublicBaccaratState
  timer: ReturnType<typeof setTimeout> | null = null
  onChange: (state: PublicBaccaratState) => void = () => undefined

  constructor(private lobby: Lobby) {
    this.state = this.base('betting')
    this.arm()
  }

  serialize(): BaccaratRoomSnap {
    return {
      kind: 'baccarat',
      shoe: [...this.shoe],
      bets: [...this.bets.entries()],
      state: this.state,
    }
  }

  hydrate(snap: BaccaratRoomSnap): void {
    this.shoe = [...snap.shoe]
    this.bets = new Map(snap.bets)
    this.state = snap.state
    this.flush()
  }

  flush(): void {
    if (
      this.state.status === 'settled' &&
      this.state.bettingEndsAt &&
      Date.now() >= this.state.bettingEndsAt
    ) {
      this.bets.clear()
      this.state = this.base('betting')
      this.arm()
      this.emit()
      return
    }
    if (
      this.state.status === 'betting' &&
      this.state.bettingEndsAt &&
      Date.now() >= this.state.bettingEndsAt
    ) {
      this.deal()
    }
  }

  place(userId: string, seat: BaccaratBetSeat, amount: number): void {
    if (this.state.status !== 'betting') {
      throw new Error('Betting closed')
    }
    const bal = store.balances.get(userId) ?? 0
    const want = Math.max(10, Math.min(Math.floor(amount), bal, 500))
    if (want > bal) {
      throw new Error('Insufficient chips')
    }
    this.bets.set(userId, { seat, amount: want })
    this.emit()
  }

  private arm(): void {
    const ends = Date.now() + 18_000
    this.state.bettingEndsAt = ends
    if (config.serverless) return
    this.timer = setTimeout(() => this.deal(), 18_000)
  }

  private deal(): void {
    if (this.shoe.length < 16) {
      this.shoe = newBaccaratShoe()
    }
    this.state.status = 'dealing'
    this.emit()
    const bets = [...this.bets.entries()].map(([playerId, b]) => ({ playerId, ...b }))
    const { result, shoe } = resolveBaccarat(this.shoe, bets)
    this.shoe = shoe
    for (const [id, delta] of Object.entries(result.payouts)) {
      const bal = store.balances.get(id) ?? 0
      store.balances.set(id, bal + delta)
    }
    const balances: Record<string, number> = {}
    for (const m of this.lobby.members) {
      balances[m.id] = store.balances.get(m.id) ?? 0
    }
    this.state = {
      kind: 'baccarat',
      status: 'settled',
      shoeRemaining: this.shoe.length,
      playerCards: result.playerCards,
      bankerCards: result.bankerCards,
      playerTotal: result.playerTotal,
      bankerTotal: result.bankerTotal,
      winner: result.winner,
      bets: Object.fromEntries(this.bets),
      balances,
      bettingEndsAt: null,
    }
    this.emit()
    if (config.serverless) {
      this.state.bettingEndsAt = Date.now() + 5_000
      return
    }
    setTimeout(() => {
      this.bets.clear()
      this.state = this.base('betting')
      this.arm()
      this.emit()
    }, 5000)
  }

  snapshot(): PublicBaccaratState {
    return this.state
  }

  private base(status: PublicBaccaratState['status']): PublicBaccaratState {
    const balances: Record<string, number> = {}
    for (const m of this.lobby.members) {
      balances[m.id] = store.balances.get(m.id) ?? 0
    }
    return {
      kind: 'baccarat',
      status,
      shoeRemaining: this.shoe.length,
      playerCards: [],
      bankerCards: [],
      playerTotal: null,
      bankerTotal: null,
      winner: null,
      bets: {},
      balances,
      bettingEndsAt: null,
    }
  }

  private emit(): void {
    this.state.bets = Object.fromEntries(this.bets)
    this.onChange(this.state)
  }
}
