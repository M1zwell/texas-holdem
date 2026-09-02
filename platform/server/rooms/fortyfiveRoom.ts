import {
  fortyFiveBotChoice,
  fortyFiveHit,
  fortyFiveStand,
  newFortyFive,
} from '../../engine/fortyfive'
import { fortyFiveTotal, type FortyFiveState } from '../../engine/points'
import type { PublicFortyFiveState } from '../../shared/types'
import type { Lobby } from '../store'
import { config } from '../config'

export interface FortyFiveRoomSnap {
  kind: 'fortyfive'
  engine: FortyFiveState
  state: PublicFortyFiveState
}

export class FortyFiveRoom {
  state: PublicFortyFiveState
  private engine = newFortyFive([
    { id: 'placeholder', name: 'tbd' },
    { id: 'bot', name: 'bot', isBot: true },
  ])
  onChange: (state: PublicFortyFiveState) => void = () => undefined

  constructor(private lobby: Lobby) {
    this.state = this.waiting()
  }

  start(): void {
    const players = this.lobby.members.map((m) => ({ id: m.id, name: m.name }))
    if (this.lobby.fillBots && players.length < 3) {
      players.push({ id: 'bot-45', name: 'GA Bot 45' })
    }
    this.engine = newFortyFive(players.map((p) => ({ ...p, isBot: p.id.startsWith('bot') })))
    this.engine.pot = 100 * this.engine.seats.length
    this.publish()
    this.maybeBot()
  }

  hit(userId: string): void {
    this.engine = fortyFiveHit(this.engine, userId)
    this.publish()
    this.maybeBot()
  }

  stand(userId: string): void {
    this.engine = fortyFiveStand(this.engine, userId)
    this.publish()
    this.maybeBot()
  }

  snapshot(): PublicFortyFiveState {
    return this.state
  }

  serialize(): FortyFiveRoomSnap {
    return { kind: 'fortyfive', engine: this.engine, state: this.state }
  }

  hydrate(snap: FortyFiveRoomSnap): void {
    this.engine = snap.engine
    this.state = snap.state
    this.flush()
  }

  flush(): void {
    this.flushBots()
  }

  private maybeBot(): void {
    if (config.serverless) {
      this.flushBots()
      return
    }
    const id = this.engine.toAct
    if (!id || !id.startsWith('bot')) return
    const seat = this.engine.seats.find((s) => s.id === id)
    if (!seat) return
    setTimeout(() => {
      if (this.engine.toAct !== id) return
      const choice = fortyFiveBotChoice(seat.cards)
      try {
        if (choice === 'hit') this.hit(id)
        else this.stand(id)
      } catch {
        /* ignore */
      }
    }, 500)
  }

  private flushBots(): void {
    for (let i = 0; i < 12; i++) {
      const id = this.engine.toAct
      if (!id || !id.startsWith('bot')) return
      const seat = this.engine.seats.find((s) => s.id === id)
      if (!seat) return
      const choice = fortyFiveBotChoice(seat.cards)
      try {
        if (choice === 'hit') this.engine = fortyFiveHit(this.engine, id)
        else this.engine = fortyFiveStand(this.engine, id)
        this.publish()
      } catch {
        return
      }
    }
  }

  private waiting(): PublicFortyFiveState {
    return {
      kind: 'fortyfive',
      status: 'waiting',
      target: 45,
      toAct: null,
      seats: [],
      winners: [],
    }
  }

  private publish(): void {
    this.state = {
      kind: 'fortyfive',
      status: this.engine.status,
      target: 45,
      toAct: this.engine.toAct,
      seats: this.engine.seats.map((s) => ({
        id: s.id,
        name: s.name,
        cards: s.cards,
        total: fortyFiveTotal(s.cards),
        status: s.status,
        isBot: s.isBot,
      })),
      winners: this.engine.winners,
    }
    this.onChange(this.state)
  }
}
