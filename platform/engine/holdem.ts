import type { CardCode, ClientAction, HoldemActionType, Street } from '../shared/types'
import { freshShoe } from './cards'
import { getScore, type HandScore } from './evaluate'

export interface HoldemConfig {
  smallBlind: number
  bigBlind: number
  startingChips: number
}

export interface Seat {
  id: string
  name: string
  chips: number
  bet: number
  folded: boolean
  allIn: boolean
  hole?: [CardCode, CardCode]
  role: 'D' | 'SB' | 'BB' | null
  isBot: boolean
}

export interface Pot {
  amount: number
  contributors: string[]
}

export type TableStatus = 'waiting' | 'playing' | 'showdown' | 'handOver'

export interface WinnerShare {
  id: string
  amount: number
  handName?: string
}

export class HoldemTable {
  readonly config: HoldemConfig
  seats: Seat[] = []
  board: CardCode[] = []
  pot = 0
  pots: Pot[] = []
  street: Street | null = null
  status: TableStatus = 'waiting'
  handId = 0
  currentBet = 0
  minRaise = 0
  toAct: string | null = null
  lastAggressor: string | null = null
  acted = new Set<string>()
  dealerIndex = -1
  winners: WinnerShare[] = []
  private deck: CardCode[] = []
  /**
   * Optional deck supplier keyed by handId. Not part of the snapshot — a room
   * re-attaches it after `loadSnapshot()`. When absent, `startHand()` falls
   * back to the crypto shuffle, which is right for a single long-lived process.
   */
  shuffler: ((handId: number) => CardCode[]) | null = null

  constructor(config: Partial<HoldemConfig> = {}) {
    this.config = {
      smallBlind: config.smallBlind ?? 50,
      bigBlind: config.bigBlind ?? 100,
      startingChips: config.startingChips ?? 2000,
    }
  }

  sit(id: string, name: string, chips?: number, isBot = false): Seat {
    if (this.seats.some((s) => s.id === id)) {
      return this.seats.find((s) => s.id === id)!
    }
    if (this.seats.length >= 10) {
      throw new Error('Table full')
    }
    const seat: Seat = {
      id,
      name,
      chips: chips ?? this.config.startingChips,
      bet: 0,
      folded: false,
      allIn: false,
      role: null,
      isBot,
    }
    this.seats.push(seat)
    return seat
  }

  stand(id: string): void {
    this.seats = this.seats.filter((s) => s.id !== id)
    if (this.status === 'playing' && this.toAct === id) {
      this.advanceAfterRemoval()
    }
  }

  canStart(): boolean {
    return this.seats.filter((s) => s.chips > 0).length >= 2 && this.status !== 'playing'
  }

  startHand(): void {
    const live = this.seats.filter((s) => s.chips > 0)
    if (live.length < 2) {
      throw new Error('Need at least 2 players with chips')
    }
    this.handId += 1
    this.deck = this.shuffler ? this.shuffler(this.handId) : freshShoe(1)
    this.board = []
    this.pot = 0
    this.pots = []
    this.winners = []
    this.acted.clear()
    this.street = 'preflop'
    this.status = 'playing'

    for (const seat of this.seats) {
      seat.bet = 0
      seat.folded = seat.chips <= 0
      seat.allIn = false
      seat.hole = undefined
      seat.role = null
    }

    const liveIdx = this.seats.map((s, i) => (s.chips > 0 ? i : -1)).filter((i) => i >= 0)
    this.dealerIndex = this.nextLiveIndex(this.dealerIndex, liveIdx)
    this.assignRoles(liveIdx)
    this.postBlinds()
    this.dealHoles()

    const bbIndex = this.seats.findIndex((s) => s.role === 'BB')
    this.currentBet = Math.max(...this.seats.map((s) => s.bet))
    this.minRaise = this.config.bigBlind
    this.lastAggressor = this.seats[bbIndex]?.id ?? null
    this.acted.clear()
    this.toAct = this.nextActor(this.seats[bbIndex]?.id ?? null, true)
    if (!this.toAct) {
      this.runoutAndShowdown()
    }
  }

  legalActions(playerId: string): ClientAction[] {
    const seat = this.seats.find((s) => s.id === playerId)
    if (
      !seat ||
      this.toAct !== playerId ||
      this.status !== 'playing' ||
      seat.folded ||
      seat.allIn
    ) {
      return []
    }
    const toCall = this.currentBet - seat.bet
    const actions: ClientAction[] = [{ type: 'fold' }]
    if (toCall <= 0) {
      actions.push({ type: 'check' })
      if (seat.chips > 0) {
        const bet = Math.min(this.config.bigBlind, seat.chips)
        actions.push({ type: 'bet', amount: bet })
        if (seat.chips > bet) {
          actions.push({ type: 'allin', amount: seat.chips })
        }
      }
    } else {
      const callAmt = Math.min(toCall, seat.chips)
      actions.push({ type: 'call', amount: callAmt })
      if (seat.chips > toCall) {
        const minRaiseTo = this.currentBet + this.minRaise
        const raiseExtra = Math.min(this.minRaise, seat.chips - toCall)
        if (seat.chips + seat.bet >= minRaiseTo) {
          actions.push({ type: 'raise', amount: raiseExtra })
        }
        actions.push({ type: 'allin', amount: seat.chips })
      } else if (seat.chips > 0 && seat.chips < toCall) {
        // short all-in is already represented as call
      }
    }
    return actions
  }

  apply(playerId: string, action: ClientAction): void {
    const legal = this.legalActions(playerId)
    if (!legal.length) {
      throw new Error('Not your turn')
    }
    const seat = this.seats.find((s) => s.id === playerId)!
    const allowed = legal.find((a) => a.type === action.type)
    if (!allowed) {
      throw new Error(`Illegal action ${action.type}`)
    }

    const type: HoldemActionType = action.type
    switch (type) {
      case 'fold':
        seat.folded = true
        break
      case 'check':
        break
      case 'call': {
        this.take(seat, allowed.amount ?? 0)
        break
      }
      case 'bet': {
        const amount = this.normalizeBet(
          seat,
          action.amount ?? allowed.amount ?? this.config.bigBlind,
        )
        this.take(seat, amount)
        this.minRaise = amount
        this.currentBet = seat.bet
        this.lastAggressor = seat.id
        this.acted.clear()
        break
      }
      case 'raise': {
        const extra = this.normalizeRaise(seat, action.amount ?? allowed.amount ?? this.minRaise)
        this.take(seat, this.currentBet - seat.bet + extra)
        this.minRaise = extra
        this.currentBet = seat.bet
        this.lastAggressor = seat.id
        this.acted.clear()
        break
      }
      case 'allin': {
        const put = seat.chips
        const newBet = seat.bet + put
        this.take(seat, put)
        if (newBet > this.currentBet) {
          this.minRaise = Math.max(this.minRaise, newBet - this.currentBet)
          this.currentBet = newBet
          this.lastAggressor = seat.id
          this.acted.clear()
        }
        break
      }
      default: {
        const _never: never = type
        throw new Error(`Unhandled action ${_never}`)
      }
    }

    this.acted.add(playerId)
    const alive = this.seats.filter((s) => !s.folded)
    if (alive.length === 1) {
      this.collectBets()
      this.award(alive, true)
      return
    }
    const next = this.nextActor(playerId, false)
    if (!next) {
      this.endStreet()
      return
    }
    this.toAct = next
  }

  private normalizeBet(seat: Seat, amount: number): number {
    const min = Math.min(this.config.bigBlind, seat.chips)
    const want = Math.max(min, Math.floor(amount))
    return Math.min(want, seat.chips)
  }

  private normalizeRaise(seat: Seat, extra: number): number {
    const toCall = this.currentBet - seat.bet
    const maxExtra = seat.chips - toCall
    const want = Math.max(this.minRaise, Math.floor(extra))
    return Math.min(want, maxExtra)
  }

  private take(seat: Seat, amount: number): void {
    const put = Math.min(Math.max(0, amount), seat.chips)
    seat.chips -= put
    seat.bet += put
    if (seat.chips === 0) {
      seat.allIn = true
    }
  }

  private assignRoles(liveIdx: number[]): void {
    const n = liveIdx.length
    const dealerPos = liveIdx.indexOf(this.dealerIndex)
    const dealer = liveIdx[dealerPos]!
    this.seats[dealer]!.role = 'D'
    if (n === 2) {
      this.seats[dealer]!.role = 'D'
      this.seats[liveIdx[dealerPos]!]!.role = 'SB'
      this.seats[liveIdx[(dealerPos + 1) % n]!]!.role = 'BB'
      this.seats[dealer]!.role = 'SB'
    } else {
      this.seats[liveIdx[(dealerPos + 1) % n]!]!.role = 'SB'
      this.seats[liveIdx[(dealerPos + 2) % n]!]!.role = 'BB'
    }
  }

  private postBlinds(): void {
    const { smallBlind, bigBlind } = this.config
    for (const seat of this.seats) {
      if (seat.role === 'SB') {
        this.take(seat, Math.min(smallBlind, seat.chips))
      } else if (seat.role === 'BB') {
        this.take(seat, Math.min(bigBlind, seat.chips))
      }
    }
  }

  private dealHoles(): void {
    for (const seat of this.seats) {
      if (seat.chips > 0 || seat.bet > 0) {
        const a = this.deck.shift()
        const b = this.deck.shift()
        if (!a || !b) {
          throw new Error('Deck exhausted')
        }
        seat.hole = [a, b]
        seat.folded = false
      }
    }
  }

  private nextLiveIndex(current: number, liveIdx: number[]): number {
    if (!liveIdx.length) {
      return 0
    }
    const pos = liveIdx.findIndex((i) => i > current)
    return pos === -1 ? liveIdx[0]! : liveIdx[pos]!
  }

  private nextActor(fromId: string | null, firstOfStreet: boolean): string | null {
    const order = this.clockwiseFrom(fromId)
    const unmatched = this.seats.filter((s) => !s.folded && !s.allIn && s.bet < this.currentBet)
    for (const seat of order) {
      if (seat.folded || seat.allIn || seat.chips < 0) {
        continue
      }
      if (firstOfStreet) {
        return seat.id
      }
      if (!this.acted.has(seat.id) || unmatched.some((s) => s.id === seat.id)) {
        if (seat.id === this.lastAggressor && this.acted.has(seat.id) && unmatched.length === 0) {
          continue
        }
        return seat.id
      }
    }
    if (unmatched.length === 0 && this.allVoluntaryActed()) {
      return null
    }
    return null
  }

  private allVoluntaryActed(): boolean {
    return this.seats
      .filter((s) => !s.folded && !s.allIn)
      .every((s) => this.acted.has(s.id) && s.bet === this.currentBet)
  }

  private clockwiseFrom(fromId: string | null): Seat[] {
    if (!this.seats.length) {
      return []
    }
    const start = fromId ? this.seats.findIndex((s) => s.id === fromId) : -1
    const out: Seat[] = []
    for (let i = 1; i <= this.seats.length; i++) {
      out.push(this.seats[(start + i + this.seats.length) % this.seats.length]!)
    }
    return out
  }

  private endStreet(): void {
    this.collectBets()
    const contenders = this.seats.filter((s) => !s.folded)
    const canBet = contenders.filter((s) => !s.allIn && s.chips > 0)
    if (contenders.length === 1) {
      this.award(contenders, true)
      return
    }
    if (this.street === 'river' || canBet.length <= 1) {
      this.runoutAndShowdown()
      return
    }
    this.dealStreet()
    this.currentBet = 0
    this.minRaise = this.config.bigBlind
    this.lastAggressor = null
    this.acted.clear()
    const sb = this.seats.find((s) => s.role === 'SB')
    this.toAct = this.nextActor(this.actorBefore(sb?.id ?? null), true)
    if (!this.toAct) {
      this.runoutAndShowdown()
    }
  }

  private actorBefore(id: string | null): string | null {
    if (!id) {
      return this.seats[this.seats.length - 1]?.id ?? null
    }
    const idx = this.seats.findIndex((s) => s.id === id)
    return this.seats[(idx - 1 + this.seats.length) % this.seats.length]?.id ?? null
  }

  private dealStreet(): void {
    this.deck.shift() // burn
    if (this.street === 'preflop') {
      this.board.push(this.deck.shift()!, this.deck.shift()!, this.deck.shift()!)
      this.street = 'flop'
    } else if (this.street === 'flop') {
      this.board.push(this.deck.shift()!)
      this.street = 'turn'
    } else if (this.street === 'turn') {
      this.board.push(this.deck.shift()!)
      this.street = 'river'
    }
  }

  private runoutAndShowdown(): void {
    while (this.street !== 'river') {
      this.dealStreet()
    }
    this.showdown()
  }

  private collectBets(): void {
    let pending = this.seats.filter((s) => s.bet > 0)
    while (pending.length) {
      const least = Math.min(...pending.map((s) => s.bet))
      const last = this.pots[this.pots.length - 1]
      const ids = pending.map((s) => s.id)
      if (!last || (last.contributors.length !== 0 && last.contributors.length > pending.length)) {
        this.pots.push({ amount: 0, contributors: [] })
      }
      const pot = this.pots[this.pots.length - 1]!
      pot.amount += least * pending.length
      pot.contributors = ids
      this.pot += least * pending.length
      for (const seat of pending) {
        seat.bet -= least
      }
      pending = this.seats.filter((s) => s.bet > 0)
    }
  }

  private showdown(): void {
    this.status = 'showdown'
    const alive = this.seats.filter((s) => !s.folded && s.hole)
    const scored = alive.map((s) => ({
      seat: s,
      score: getScore([...(s.hole as [CardCode, CardCode]), ...this.board]),
    }))
    this.award(
      scored.sort((a, b) => b.score.value - a.score.value).map((x) => x.seat),
      false,
      scored,
    )
  }

  private award(
    ranked: Seat[],
    foldedWin: boolean,
    scored?: { seat: Seat; score: HandScore }[],
  ): void {
    const shares: WinnerShare[] = []
    let current = this.pots.shift()
    while (current) {
      const eligible = ranked.filter((s) => current!.contributors.includes(s.id))
      let winners: Seat[]
      if (foldedWin) {
        winners = eligible.slice(0, 1)
      } else if (scored) {
        const eligibleScores = scored.filter((x) => eligible.includes(x.seat))
        const best = Math.max(...eligibleScores.map((x) => x.score.value))
        winners = eligibleScores.filter((x) => x.score.value === best).map((x) => x.seat)
      } else {
        winners = eligible.slice(0, 1)
      }
      if (!winners.length) {
        const even = Math.floor(current.amount / current.contributors.length)
        for (const id of current.contributors) {
          const seat = this.seats.find((s) => s.id === id)
          if (seat) {
            seat.chips += even
          }
        }
      } else {
        const even = Math.floor(current.amount / winners.length)
        const rem = current.amount - even * winners.length
        winners.forEach((w, i) => {
          const add = even + (i === 0 ? rem : 0)
          w.chips += add
          const existing = shares.find((s) => s.id === w.id)
          const handName = scored?.find((x) => x.seat.id === w.id)?.score.name
          if (existing) {
            existing.amount += add
          } else {
            shares.push({ id: w.id, amount: add, handName })
          }
        })
      }
      current = this.pots.shift()
    }
    this.winners = shares
    this.status = 'handOver'
    this.toAct = null
    this.street = this.street ?? 'river'
  }

  private advanceAfterRemoval(): void {
    const alive = this.seats.filter((s) => !s.folded && s.chips + s.bet > 0)
    if (alive.length <= 1) {
      this.collectBets()
      if (alive.length === 1) {
        this.award(alive, true)
      } else {
        this.status = 'waiting'
      }
      return
    }
    const next = this.nextActor(this.toAct, false)
    if (!next) {
      this.endStreet()
    } else {
      this.toAct = next
    }
  }

  toSnapshot(): HoldemSnapshot {
    return {
      config: this.config,
      seats: this.seats.map((s) => ({ ...s, hole: s.hole ? [...s.hole] : undefined })),
      board: [...this.board],
      pot: this.pot,
      pots: this.pots.map((p) => ({ ...p, contributors: [...p.contributors] })),
      street: this.street,
      status: this.status,
      handId: this.handId,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      toAct: this.toAct,
      lastAggressor: this.lastAggressor,
      acted: [...this.acted],
      dealerIndex: this.dealerIndex,
      winners: [...this.winners],
      deck: [...this.deck],
    }
  }

  loadSnapshot(snap: HoldemSnapshot): void {
    this.seats = snap.seats.map((s) => ({
      ...s,
      hole: s.hole ? [s.hole[0], s.hole[1]] : undefined,
    }))
    this.board = [...snap.board]
    this.pot = snap.pot
    this.pots = snap.pots.map((p) => ({ ...p, contributors: [...p.contributors] }))
    this.street = snap.street
    this.status = snap.status
    this.handId = snap.handId
    this.currentBet = snap.currentBet
    this.minRaise = snap.minRaise
    this.toAct = snap.toAct
    this.lastAggressor = snap.lastAggressor
    this.acted = new Set(snap.acted)
    this.dealerIndex = snap.dealerIndex
    this.winners = [...snap.winners]
    this.deck = [...snap.deck]
  }
}

export interface HoldemSnapshot {
  config: HoldemConfig
  seats: Seat[]
  board: CardCode[]
  pot: number
  pots: Pot[]
  street: Street | null
  status: TableStatus
  handId: number
  currentBet: number
  minRaise: number
  toAct: string | null
  lastAggressor: string | null
  acted: string[]
  dealerIndex: number
  winners: WinnerShare[]
  deck: CardCode[]
}
