import type { PublicGameState } from '../../shared/types'
import type { Lobby } from '../store'
import { HoldemRoom } from './holdemRoom'
import { BaccaratRoom } from './baccaratRoom'
import { TttRoom } from './tictactoeRoom'
import { FortyFiveRoom } from './fortyfiveRoom'
import { BlackjackRoom } from './blackjackRoom'
import type { RoomSnapshot } from './snapshot'

export type AnyRoom = HoldemRoom | BaccaratRoom | TttRoom | FortyFiveRoom | BlackjackRoom

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
    room.flush()
    if (room instanceof HoldemRoom) return room.publicState(viewerId)
    if (room instanceof BlackjackRoom) return room.snapshot(viewerId)
    return room.snapshot()
  }

  serialize(lobby: Lobby): RoomSnapshot | null {
    const room = this.rooms.get(lobby.id)
    if (!room) return null
    return room.serialize()
  }

  hydrate(lobby: Lobby, snap: RoomSnapshot): AnyRoom {
    const room = this.get(lobby)
    switch (snap.kind) {
      case 'holdem':
        if (room instanceof HoldemRoom) room.hydrate(snap)
        break
      case 'baccarat':
        if (room instanceof BaccaratRoom) room.hydrate(snap)
        break
      case 'tictactoe':
        if (room instanceof TttRoom) room.hydrate(snap)
        break
      case 'fortyfive':
        if (room instanceof FortyFiveRoom) room.hydrate(snap)
        break
      case 'blackjack':
        if (room instanceof BlackjackRoom) room.hydrate(snap)
        break
      default: {
        const _n: never = snap
        throw new Error(`Unknown room snapshot ${JSON.stringify(_n)}`)
      }
    }
    return room
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
      case 'fortyfive': {
        const room = new FortyFiveRoom(lobby)
        room.onChange = (state) => this.broadcast(lobby.id, state)
        return room
      }
      case 'blackjack': {
        const room = new BlackjackRoom(lobby)
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
