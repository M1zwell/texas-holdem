import { HoldemTable } from '../../engine/holdem'
import { botAction, DEFAULT_THETA } from '../../engine/genetic'
import { estimateEquity } from '../../engine/montecarlo'
import type { ClientAction, PublicHoldemState, PublicPlayer } from '../../shared/types'
import type { Lobby } from '../store'
import { config } from '../config'

export class HoldemRoom {
  table = new HoldemTable()
  turnTimer: ReturnType<typeof setTimeout> | null = null
  turnEndsAt: number | null = null
  onChange: (state: PublicHoldemState) => void = () => undefined

  constructor(private lobby: Lobby) {
    if (lobby.blinds) {
      this.table = new HoldemTable({
        smallBlind: lobby.blinds.small,
        bigBlind: lobby.blinds.big,
        startingChips: 2000,
      })
    }
  }

  syncSeats(): void {
    for (const member of this.lobby.members) {
      this.table.sit(member.id, member.name)
    }
    if (this.lobby.fillBots) {
      const need = Math.max(0, 3 - this.table.seats.filter((s) => s.chips > 0).length)
      for (let i = 0; i < need; i++) {
        this.table.sit(`bot-${i}`, `GA Bot ${i + 1}`, undefined, true)
      }
    }
  }

  maybeStart(): void {
    this.syncSeats()
    if (this.table.canStart()) {
      this.table.startHand()
      this.lobby.status = 'playing'
      this.armTurn()
      this.emit()
      this.maybeBot()
    } else {
      this.emit()
    }
  }

  act(userId: string, action: ClientAction): void {
    this.table.apply(userId, action)
    this.clearTurn()
    if (this.table.status === 'handOver') {
      this.lobby.status = 'waiting'
      this.emit()
      setTimeout(() => {
        if (this.table.canStart()) {
          this.table.startHand()
          this.lobby.status = 'playing'
          this.armTurn()
          this.emit()
          this.maybeBot()
        }
      }, 3500)
      return
    }
    this.armTurn()
    this.emit()
    this.maybeBot()
  }

  publicState(viewerId?: string): PublicHoldemState {
    const legal = viewerId ? this.table.legalActions(viewerId) : []
    const youSeat = this.table.seats.find((s) => s.id === viewerId)
    let equity: { win: number; tie: number } | undefined
    if (youSeat?.hole && this.table.status === 'playing' && this.table.board.length >= 3) {
      const eq = estimateEquity(youSeat.hole, this.table.board, 180, 1)
      equity = { win: eq.win, tie: eq.tie }
    }
    const players: PublicPlayer[] = this.table.seats.map((s) => ({
      id: s.id,
      name: s.name,
      chips: s.chips,
      bet: s.bet,
      folded: s.folded,
      allIn: s.allIn,
      role: s.role,
      isBot: s.isBot,
      connected: !s.isBot,
      hole:
        this.table.status === 'handOver' || this.table.status === 'showdown' || s.id === viewerId
          ? s.hole ?? null
          : null,
    }))
    return {
      kind: 'holdem',
      handId: this.table.handId,
      street: this.table.street,
      status: this.table.status,
      board: this.table.board,
      pot: this.table.pot,
      pots: this.table.pots,
      currentBet: this.table.currentBet,
      minRaise: this.table.minRaise,
      toAct: this.table.toAct,
      turnEndsAt: this.turnEndsAt,
      players,
      winners: this.table.winners,
      legal,
      you: youSeat?.hole ? { hole: youSeat.hole, equity } : undefined,
    }
  }

  private armTurn(): void {
    this.clearTurn()
    if (this.table.status !== 'playing' || !this.table.toAct) {
      return
    }
    this.turnEndsAt = Date.now() + config.turnMs
    this.turnTimer = setTimeout(() => {
      const id = this.table.toAct
      if (!id) return
      const legal = this.table.legalActions(id)
      const auto =
        legal.find((a) => a.type === 'check') ?? legal.find((a) => a.type === 'fold') ?? legal[0]
      if (auto) {
        try {
          this.act(id, auto)
        } catch {
          /* seat left */
        }
      }
    }, config.turnMs)
  }

  private clearTurn(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer)
    }
    this.turnTimer = null
    this.turnEndsAt = null
  }

  private maybeBot(): void {
    const id = this.table.toAct
    if (!id) return
    const seat = this.table.seats.find((s) => s.id === id)
    if (!seat?.isBot) return
    setTimeout(() => {
      if (this.table.toAct !== id) return
      const legal = this.table.legalActions(id)
      const action = botAction({
        street: this.table.street ?? 'preflop',
        seat,
        board: this.table.board,
        pot: this.table.pot,
        toCall: this.table.currentBet - seat.bet,
        legal,
        theta: DEFAULT_THETA,
        cashCap: this.table.config.startingChips,
      })
      try {
        this.act(id, action)
      } catch {
        /* ignore */
      }
    }, 600)
  }

  private emit(): void {
    this.onChange(this.publicState())
  }
}
