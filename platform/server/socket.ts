import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { config } from './config'
import { verifySession } from './auth'
import { store } from './store'
import { rooms } from './rooms/registry'
import { HoldemRoom } from './rooms/holdemRoom'
import { BaccaratRoom } from './rooms/baccaratRoom'
import { TttRoom } from './rooms/tictactoeRoom'
import type { Bus } from './redisBus'
import type { ClientAction } from '../shared/types'

export function attachSocket(httpServer: HttpServer, bus: Bus) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
    path: `${config.basePath || ''}/socket.io`,
  })

  io.use((socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token ?? '')
      socket.data.user = verifySession(token)
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  rooms.listeners.add((lobbyId, state) => {
    const lobby = store.lobbies.get(lobbyId)
    if (lobby && state.kind === 'holdem') {
      void io
        .in(lobbyId)
        .fetchSockets()
        .then((sockets) => {
          for (const sock of sockets) {
            const viewer = sock.data.user as { id: string } | undefined
            sock.emit('gameState', rooms.snapshot(lobby, viewer?.id))
          }
        })
    } else {
      io.to(lobbyId).emit('gameState', state)
    }
    void bus.publish('game-moves', JSON.stringify({ lobbyId, state }))
  })

  void bus.subscribe('game-moves', (message) => {
    try {
      const parsed = JSON.parse(message) as { lobbyId: string; state: unknown; hop?: boolean }
      if (parsed.hop) return
      io.to(parsed.lobbyId).emit('gameState', parsed.state)
    } catch {
      /* ignore malformed bus payloads */
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user

    socket.on('join_room', (payload: { lobbyId: string }) => {
      const lobby = store.lobbies.get(payload.lobbyId)
      if (!lobby || !lobby.members.some((m) => m.id === user.id)) {
        socket.emit('error', { message: 'Join the lobby over HTTP first (preview + confirm).' })
        return
      }
      socket.join(lobby.id)
      const room = rooms.get(lobby)
      if (room instanceof HoldemRoom) {
        room.syncSeats()
        socket.emit('gameState', room.publicState(user.id))
      } else if (room instanceof TttRoom) {
        room.assign()
        socket.emit('gameState', room.snapshot())
      } else if (room instanceof BaccaratRoom) {
        socket.emit('gameState', room.snapshot())
      }
      io.to(lobby.id).emit('lobby', {
        members: lobby.members,
        waitlist: lobby.hostId === user.id ? lobby.waitlist : [],
        hostId: lobby.hostId,
      })
    })

    socket.on('start_hand', (payload: { lobbyId: string }) => {
      const lobby = store.requireLobby(payload.lobbyId)
      if (lobby.hostId !== user.id) {
        socket.emit('error', { message: 'Only the host can start' })
        return
      }
      const room = rooms.get(lobby)
      if (room instanceof HoldemRoom) {
        room.maybeStart()
      } else if (room instanceof TttRoom) {
        room.assign()
      }
    })

    socket.on('player_action', (payload: { lobbyId: string; action: ClientAction }) => {
      const lobby = store.requireLobby(payload.lobbyId)
      const room = rooms.get(lobby)
      if (!(room instanceof HoldemRoom)) return
      try {
        room.act(user.id, payload.action)
        socket.emit('gameState', room.publicState(user.id))
      } catch (err) {
        socket.emit('error', { message: (err as Error).message })
      }
    })

    socket.on(
      'baccarat_bet',
      (payload: { lobbyId: string; seat: 'player' | 'banker' | 'tie'; amount: number }) => {
        const lobby = store.requireLobby(payload.lobbyId)
        const room = rooms.get(lobby)
        if (!(room instanceof BaccaratRoom)) return
        try {
          room.place(user.id, payload.seat, payload.amount)
        } catch (err) {
          socket.emit('error', { message: (err as Error).message })
        }
      },
    )

    socket.on('ttt_move', (payload: { lobbyId: string; index: number }) => {
      const lobby = store.requireLobby(payload.lobbyId)
      const room = rooms.get(lobby)
      if (!(room instanceof TttRoom)) return
      try {
        room.move(user.id, payload.index)
      } catch (err) {
        socket.emit('error', { message: (err as Error).message })
      }
    })

    socket.on('ttt_reset', (payload: { lobbyId: string }) => {
      const lobby = store.requireLobby(payload.lobbyId)
      const room = rooms.get(lobby)
      if (room instanceof TttRoom) {
        room.reset(user.id)
      }
    })

    socket.on('chat', (payload: { lobbyId: string; text: string }) => {
      const text = String(payload.text ?? '')
        .trim()
        .slice(0, 200)
      if (!text) return
      io.to(payload.lobbyId).emit('chat', {
        id: `${Date.now()}`,
        userId: user.id,
        name: user.name,
        text,
        at: Date.now(),
      })
    })

    socket.on('leave_room', (payload: { lobbyId: string }) => {
      store.leave(payload.lobbyId, user.id)
      socket.leave(payload.lobbyId)
    })
  })

  return io
}
