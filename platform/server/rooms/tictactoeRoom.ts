import { emptyTtt, minimaxMove, playTtt, type TttState } from '../../engine/tictactoe'
import type { PublicTttState } from '../../shared/types'
import type { Lobby } from '../store'

export class TttRoom {
  game: TttState = emptyTtt()
  seats: { X?: string; O?: string } = {}
  onChange: (state: PublicTttState) => void = () => undefined

  constructor(private lobby: Lobby) {
    this.assign()
  }

  assign(): void {
    const [a, b] = this.lobby.members
    this.seats.X = a?.id
    this.seats.O = b?.id
    if (!this.seats.O && this.lobby.fillBots) {
      this.seats.O = 'bot-ttt'
    }
    this.emit()
  }

  move(userId: string, index: number): void {
    const mark = this.game.xIsNext ? 'X' : 'O'
    if (this.seats[mark] !== userId) {
      throw new Error('Not your turn')
    }
    this.game = playTtt(this.game, index)
    this.emit()
    if (!this.game.winner && this.seats.O === 'bot-ttt' && !this.game.xIsNext) {
      const idx = minimaxMove(this.game.board, 'O')
      this.game = playTtt(this.game, idx)
      this.emit()
    }
  }

  reset(userId: string): void {
    if (userId !== this.lobby.hostId) {
      throw new Error('Only the host can reset')
    }
    this.game = emptyTtt()
    this.emit()
  }

  snapshot(): PublicTttState {
    const names: Record<string, string> = {}
    for (const m of this.lobby.members) names[m.id] = m.name
    if (this.seats.O === 'bot-ttt') names['bot-ttt'] = 'Minimax Bot'
    return {
      kind: 'tictactoe',
      board: this.game.board,
      xIsNext: this.game.xIsNext,
      winner: this.game.winner,
      players: this.seats,
      names,
    }
  }

  private emit(): void {
    this.onChange(this.snapshot())
  }
}
