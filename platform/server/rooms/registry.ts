import type { PublicGameState } from '../../shared/types'
import type { Lobby } from '../store'
import { HoldemRoom } from './holdemRoom'
import { BaccaratRoom } from './baccaratRoom'
import { TttRoom } from './tictactoeRoom'

export type AnyRoom = HoldemRoom | BaccaratRoom | TttRoom

export class RoomRegistry {
  rooms = new Map<string, AnyRoom>()
  listeners = new Set<(lobbyId: string, state: PublicGameState, viewerId?: string) => void>()

  get(lobby: Lobby): AnyRoom {
    const existing = this.rooms.get(lobby.id)
    if (existing) return existing
    const room = this.create(lobby)
    this.rooms.set(lobby.id, room)
    return room
  }

  snapshot(lobby: Lobby, viewerId?: string): PublicGameState {
    const room = this.get(lobby)
    if (room instanceof HoldemRoom) return room.publicState(viewerId)
    if (room instanceof BaccaratRoom) return room.snapshot()
    return room.snapshot()
  }

  private create(lobby: Lobby): AnyRoom {
    switch (lobby.game) {
      case 'holdem': {
        const room = new HoldemRoom(lobby)
        room.onChange = (state) => this.broadcast(lobby.id, state)
        return room
      }
      case 'baccarat': {
        const room = new BaccaratRoom(lobby)
        room.onChange = (state) => this.broadcast(lobby.id, state)
        return room
      }
      case 'tictactoe': {
        const room = new TttRoom(lobby)
        room.onChange = (state) => this.broadcast(lobby.id, state)
        return room
      }
      default: {
        const _n: never = lobby.game
        throw new Error(`Unknown game ${_n}`)
      }
    }
  }

  private broadcast(lobbyId: string, state: PublicGameState): void {
    for (const fn of this.listeners) {
      fn(lobbyId, state)
    }
  }
}

export const rooms = new RoomRegistry()
