import type { ChatMessage, ClientAction, PlayRequest, SessionUser } from '../shared/types'
import { rooms } from './rooms/registry'
import { store } from './store'
import { persistRuntime } from './supabase'
import { publicLobby } from './view'
import { BaccaratRoom } from './rooms/baccaratRoom'
import { BlackjackRoom } from './rooms/blackjackRoom'
import { FortyFiveRoom } from './rooms/fortyfiveRoom'
import { HoldemRoom } from './rooms/holdemRoom'
import { TttRoom } from './rooms/tictactoeRoom'

function parsePlay(body: Record<string, unknown>): PlayRequest {
  const type = String(body.type ?? '')
  switch (type) {
    case 'start':
      return { type: 'start' }
    case 'holdem':
      return { type: 'holdem', action: body.action as ClientAction }
    case 'baccarat_bet':
      return {
        type: 'baccarat_bet',
        seat: body.seat as 'player' | 'banker' | 'tie',
        amount: Number(body.amount ?? 100),
      }
    case 'ttt_move':
      return { type: 'ttt_move', index: Number(body.index) }
    case 'ttt_reset':
      return { type: 'ttt_reset' }
    case 'fortyfive_hit':
      return { type: 'fortyfive_hit' }
    case 'fortyfive_stand':
      return { type: 'fortyfive_stand' }
    case 'blackjack_deal':
      return { type: 'blackjack_deal', amount: Number(body.amount ?? 100) }
    case 'blackjack_hit':
      return { type: 'blackjack_hit' }
    case 'blackjack_stand':
      return { type: 'blackjack_stand' }
    case 'chat':
      return { type: 'chat', text: String(body.text ?? '') }
    default:
      throw Object.assign(new Error('Unknown play action'), { status: 400 })
  }
}

export async function applyPlay(lobbyId: string, user: SessionUser, body: Record<string, unknown>) {
  const lobby = store.requireLobby(lobbyId)
  if (!lobby.members.some((m) => m.id === user.id) && lobby.hostId !== user.id) {
    throw Object.assign(new Error('Join the lobby first'), { status: 403 })
  }
  const request = parsePlay(body)
  const room = rooms.get(lobby)
  let chat: ChatMessage | undefined

  switch (request.type) {
    case 'start': {
      if (lobby.hostId !== user.id) {
        throw Object.assign(new Error('Only the host can start'), { status: 403 })
      }
      if (room instanceof HoldemRoom) room.maybeStart()
      else if (room instanceof TttRoom) room.assign()
      else if (room instanceof FortyFiveRoom) room.start()
      else if (room instanceof BlackjackRoom) room.deal(user.id, 100)
      break
    }
    case 'holdem': {
      if (!(room instanceof HoldemRoom))
        throw Object.assign(new Error("Not a Hold'em table"), { status: 400 })
      room.act(user.id, request.action)
      break
    }
    case 'baccarat_bet': {
      if (!(room instanceof BaccaratRoom))
        throw Object.assign(new Error('Not a Baccarat table'), { status: 400 })
      room.place(user.id, request.seat, request.amount)
      break
    }
    case 'ttt_move': {
      if (!(room instanceof TttRoom))
        throw Object.assign(new Error('Not a Tic-Tac-Toe table'), { status: 400 })
      room.move(user.id, request.index)
      break
    }
    case 'ttt_reset': {
      if (!(room instanceof TttRoom))
        throw Object.assign(new Error('Not a Tic-Tac-Toe table'), { status: 400 })
      room.reset(user.id)
      break
    }
    case 'fortyfive_hit': {
      if (!(room instanceof FortyFiveRoom))
        throw Object.assign(new Error('Not a 45-Bust table'), { status: 400 })
      room.hit(user.id)
      break
    }
    case 'fortyfive_stand': {
      if (!(room instanceof FortyFiveRoom))
        throw Object.assign(new Error('Not a 45-Bust table'), { status: 400 })
      room.stand(user.id)
      break
    }
    case 'blackjack_deal': {
      if (!(room instanceof BlackjackRoom))
        throw Object.assign(new Error('Not a Blackjack table'), { status: 400 })
      room.deal(user.id, request.amount ?? 100)
      break
    }
    case 'blackjack_hit': {
      if (!(room instanceof BlackjackRoom))
        throw Object.assign(new Error('Not a Blackjack table'), { status: 400 })
      room.hit(user.id)
      break
    }
    case 'blackjack_stand': {
      if (!(room instanceof BlackjackRoom))
        throw Object.assign(new Error('Not a Blackjack table'), { status: 400 })
      room.stand(user.id)
      break
    }
    case 'chat': {
      const text = request.text.trim().slice(0, 200)
      if (text) {
        chat = store.addChat(lobbyId, {
          id: `${Date.now()}`,
          userId: user.id,
          name: user.name,
          text,
          at: Date.now(),
        })
      }
      break
    }
    default: {
      const _n: never = request
      throw Object.assign(new Error(`Unhandled play ${_n}`), { status: 400 })
    }
  }

  room.flush()
  await persistRuntime(lobby)
  return {
    lobby: publicLobby(lobby, lobby.hostId === user.id),
    state: rooms.snapshot(lobby, user.id),
    chat,
  }
}
