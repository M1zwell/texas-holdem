export type TttMark = 'X' | 'O'
export type TttCell = TttMark | null
export type TttWinner = TttMark | 'draw' | null

export interface TttState {
  board: TttCell[]
  xIsNext: boolean
  winner: TttWinner
}

export function emptyTtt(): TttState {
  return { board: Array(9).fill(null), xIsNext: true, winner: null }
}

export function tttWinner(board: TttCell[]): TttWinner {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  for (const [a, b, c] of lines) {
    const v = board[a!]
    if (v && v === board[b!] && v === board[c!]) {
      return v
    }
  }
  if (board.every((cell) => cell !== null)) {
    return 'draw'
  }
  return null
}

export function playTtt(state: TttState, index: number): TttState {
  if (state.winner || state.board[index] !== null || index < 0 || index > 8) {
    throw new Error('Illegal move')
  }
  const board = state.board.slice()
  board[index] = state.xIsNext ? 'X' : 'O'
  return { board, xIsNext: !state.xIsNext, winner: tttWinner(board) }
}

/** Minimax with depth-weighted score. Used for the Tic-Tac-Toe AI seat. */
export function minimaxMove(board: TttCell[], ai: TttMark = 'O'): number {
  const human: TttMark = ai === 'X' ? 'O' : 'X'

  function score(winner: TttWinner, depth: number): number {
    if (winner === ai) return 10 - depth
    if (winner === human) return depth - 10
    return 0
  }

  function search(
    cells: TttCell[],
    maximizing: boolean,
    depth: number,
  ): { value: number; move: number } {
    const winner = tttWinner(cells)
    if (winner) {
      return { value: score(winner, depth), move: -1 }
    }
    let best = { value: maximizing ? -Infinity : Infinity, move: -1 }
    for (let i = 0; i < 9; i++) {
      if (cells[i] !== null) continue
      cells[i] = maximizing ? ai : human
      const result = search(cells, !maximizing, depth + 1)
      cells[i] = null
      if (maximizing ? result.value > best.value : result.value < best.value) {
        best = { value: result.value, move: i }
      }
    }
    return best
  }

  const { move } = search(board.slice(), true, 0)
  if (move < 0) {
    return board.findIndex((c) => c === null)
  }
  return move
}
