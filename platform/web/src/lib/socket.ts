import { io, Socket } from 'socket.io-client'
import { getToken } from './api'

let socket: Socket | null = null

export function connectSocket(): Socket {
  if (socket?.connected) return socket
  socket = io({
    path: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/socket.io`,
    auth: { token: getToken() },
  })
  return socket
}
