/** Shared protocol types for Jub Poker (play-chip social tables). */

export type GameKind = 'holdem' | 'baccarat' | 'tictactoe' | 'blackjack' | 'fortyfive'

export type RankChar = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'
export type SuitChar = 's' | 'h' | 'd' | 'c'
export type CardCode = `${RankChar}${SuitChar}`

export type Street = 'preflop' | 'flop' | 'turn' | 'river'
export type HandCategory =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush'

export type LobbyStatus = 'waiting' | 'playing' | 'closed'

export interface SessionUser {
  id: string
  name: string
  guest: boolean
}

export interface InviteClaims {
  typ: 'invite'
  lobbyId: string
  code: string
  hostId: string
  game: GameKind
  singleUse?: boolean
}

export interface LobbyPreview {
  lobbyId: string
  name: string
  hostName: string
  game: GameKind
  status: LobbyStatus
  playerCount: number
  maxPlayers: number
  approvalRequired: boolean
  expiresAt: number
  blinds?: { small: number; big: number }
}

export type JoinFailureReason =
  | 'missing'
  | 'invalid'
  | 'expired'
  | 'full'
  | 'playing'
  | 'closed'
  | 'region'
  | 'rate_limited'

export type HoldemActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin'

export interface ClientAction {
  type: HoldemActionType
  amount?: number
}

export interface PublicPlayer {
  id: string
  name: string
  chips: number
  bet: number
  folded: boolean
  allIn: boolean
  role: 'D' | 'SB' | 'BB' | null
  isBot: boolean
  connected: boolean
  hole?: CardCode[] | null
}

export interface PublicHoldemState {
  kind: 'holdem'
  handId: number
  street: Street | null
  status: 'waiting' | 'playing' | 'showdown' | 'handOver'
  board: CardCode[]
  pot: number
  pots: { amount: number; contributors: string[] }[]
  currentBet: number
  minRaise: number
  toAct: string | null
  turnEndsAt: number | null
  players: PublicPlayer[]
  winners?: { id: string; amount: number; handName?: string }[]
  legal?: ClientAction[]
  you?: { hole: CardCode[]; equity?: { win: number; tie: number } }
}

export interface PublicBaccaratState {
  kind: 'baccarat'
  status: 'betting' | 'dealing' | 'settled'
  shoeRemaining: number
  playerCards: CardCode[]
  bankerCards: CardCode[]
  playerTotal: number | null
  bankerTotal: number | null
  winner: 'player' | 'banker' | 'tie' | null
  bets: Record<string, { seat: 'player' | 'banker' | 'tie'; amount: number }>
  balances: Record<string, number>
  bettingEndsAt: number | null
}

export interface PublicTttState {
  kind: 'tictactoe'
  board: Array<'X' | 'O' | null>
  xIsNext: boolean
  winner: 'X' | 'O' | 'draw' | null
  players: { X?: string; O?: string }
  names: Record<string, string>
}

export interface PublicFortyFiveState {
  kind: 'fortyfive'
  status: 'waiting' | 'playing' | 'settled'
  target: 45
  toAct: string | null
  seats: Array<{
    id: string
    name: string
    cards: CardCode[]
    total: number
    status: 'playing' | 'stand' | 'bust' | 'blackjack'
    isBot: boolean
  }>
  winners: { id: string; total: number; amount: number }[]
}

export interface PublicBlackjackState {
  kind: 'blackjack'
  status: 'betting' | 'playing' | 'settled'
  player: { cards: CardCode[]; total: number; status: string }
  dealer: { cards: CardCode[]; total: number; status: string; holeHidden: boolean }
  outcome: 'player' | 'dealer' | 'push' | null
  bet: number
  balance: number
}

export type PublicGameState =
  | PublicHoldemState
  | PublicBaccaratState
  | PublicTttState
  | PublicFortyFiveState
  | PublicBlackjackState

export interface ChatMessage {
  id: string
  userId: string
  name: string
  text: string
  at: number
}

export type PlayRequest =
  | { type: 'start' }
  | { type: 'holdem'; action: ClientAction }
  | { type: 'baccarat_bet'; seat: 'player' | 'banker' | 'tie'; amount: number }
  | { type: 'ttt_move'; index: number }
  | { type: 'ttt_reset' }
  | { type: 'fortyfive_hit' }
  | { type: 'fortyfive_stand' }
  | { type: 'blackjack_deal'; amount?: number }
  | { type: 'blackjack_hit' }
  | { type: 'blackjack_stand' }
  | { type: 'chat'; text: string }
