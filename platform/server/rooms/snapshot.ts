import type { BaccaratRoomSnap } from './baccaratRoom'
import type { BlackjackRoomSnap } from './blackjackRoom'
import type { FortyFiveRoomSnap } from './fortyfiveRoom'
import type { HoldemRoomSnap } from './holdemRoom'
import type { TttRoomSnap } from './tictactoeRoom'

export type RoomSnapshot =
  | HoldemRoomSnap
  | BaccaratRoomSnap
  | TttRoomSnap
  | FortyFiveRoomSnap
  | BlackjackRoomSnap
