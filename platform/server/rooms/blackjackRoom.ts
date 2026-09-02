import { blackjackHit, blackjackPayout, blackjackStand, newBlackjack } from '../../engine/blackjack'
import { blackjackTotal, type BlackjackState } from '../../engine/points'
import type { PublicBlackjackState } from '../../shared/types'
import type { Lobby } from '../store'
import { store } from '../store'

export interface BlackjackRoomSnap {
  kind: 'blackjack'
  engine: BlackjackState | null
  state: PublicBlackjackState
}

export class BlackjackRoom {
  state: PublicBlackjackState
  onChange: (state: PublicBlackjackState) => void = () => undefined
  private engine: ReturnType<typeof newBlackjack> | null = null

  constructor(private lobby: Lobby) {
    this.state = this.idle()
  }

  deal(userId: string, bet = 100): void {
    const user = this.lobby.members.find((m) => m.id === userId)
    if (!user) throw new Error('Sit first')
    const bal = store.balances.get(userId) ?? 0
    const want = Math.max(10, Math.min(bet, bal, 500))
    this.engine = newBlackjack({ id: user.id, name: user.name }, want)
    store.balances.set(userId, bal - want)
    this.settleIfDone(userId)
    this.publish(userId)
  }

  hit(userId: string): void {
    if (!this.engine) throw new Error('No hand')
    this.engine = blackjackHit(this.engine)
    this.settleIfDone(userId)
    this.publish(userId)
  }

  stand(userId: string): void {
    if (!this.engine) throw new Error('No hand')
    this.engine = blackjackStand(this.engine)
    this.settleIfDone(userId)
    this.publish(userId)
  }

  snapshot(viewerId?: string): PublicBlackjackState {
    if (viewerId) this.publish(viewerId)
    return this.state
  }

  serialize(): BlackjackRoomSnap {
    return { kind: 'blackjack', engine: this.engine, state: this.state }
  }

  hydrate(snap: BlackjackRoomSnap): void {
    this.engine = snap.engine
    this.state = snap.state
  }

  flush(): void {
    /* blackjack has no delayed timers */
  }

  private settleIfDone(userId: string): void {
    if (!this.engine || this.engine.status !== 'settled') return
    const playerBj =
      blackjackTotal(this.engine.player.cards).total === 21 && this.engine.player.cards.length === 2
    const delta = blackjackPayout(this.engine.bet, this.engine.outcome, playerBj)
    const bal = store.balances.get(userId) ?? 0
    store.balances.set(userId, bal + this.engine.bet + delta)
  }

  private idle(): PublicBlackjackState {
    return {
      kind: 'blackjack',
      status: 'betting',
      player: { cards: [], total: 0, status: 'playing' },
      dealer: { cards: [], total: 0, status: 'playing', holeHidden: true },
      outcome: null,
      bet: 0,
      balance: 0,
    }
  }

  private publish(viewerId?: string): void {
    if (!this.engine) {
      this.state = this.idle()
      if (viewerId) this.state.balance = store.balances.get(viewerId) ?? 0
      this.onChange(this.state)
      return
    }
    const hide = this.engine.status === 'playing'
    const dealerCards = hide ? [this.engine.dealer.cards[0]!, null] : this.engine.dealer.cards
    this.state = {
      kind: 'blackjack',
      status: this.engine.status,
      player: {
        cards: this.engine.player.cards,
        total: blackjackTotal(this.engine.player.cards).total,
        status: this.engine.player.status,
      },
      dealer: {
        cards: hide ? [this.engine.dealer.cards[0]!] : this.engine.dealer.cards,
        total: hide ? 0 : blackjackTotal(this.engine.dealer.cards).total,
        status: this.engine.dealer.status,
        holeHidden: hide,
      },
      outcome: this.engine.outcome,
      bet: this.engine.bet,
      balance: viewerId ? store.balances.get(viewerId) ?? 0 : 0,
    }
    void dealerCards
    this.onChange(this.state)
  }
}
