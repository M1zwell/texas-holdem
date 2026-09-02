import { io, Socket } from 'socket.io-client'
import { api, getToken } from './api'

let socket: Socket | null = null
let socketAllowed: boolean | undefined

async function socketsEnabled(): Promise<boolean> {
  if (socketAllowed !== undefined) return socketAllowed
  try {
    const health = await api.health()
    socketAllowed = Boolean(health.socket)
  } catch {
    socketAllowed = false
  }
  return socketAllowed
}

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket
  if (!(await socketsEnabled())) return null
  socket = io({
    path: `${import.meta.env.BASE_URL.replace(/\/$/, '')}/socket.io`,
    auth: { token: getToken() },
  })
  socket.on('connect_error', () => {
    /* Serverless hosts have no long-lived Socket.IO; REST play is the fallback. */
  })
  return socket
}

export async function play(lobbyId: string, body: Record<string, unknown>) {
  const sock = await connectSocket()
  if (sock?.connected) {
    const type = String(body.type ?? '')
    if (type === 'start') sock.emit('start_hand', { lobbyId })
    else if (type === 'holdem') sock.emit('player_action', { lobbyId, action: body.action })
    else if (type === 'baccarat_bet')
      sock.emit('baccarat_bet', { lobbyId, seat: body.seat, amount: body.amount })
    else if (type === 'fortyfive_hit') sock.emit('fortyfive_hit', { lobbyId })
    else if (type === 'fortyfive_stand') sock.emit('fortyfive_stand', { lobbyId })
    else if (type === 'blackjack_deal')
      sock.emit('blackjack_deal', { lobbyId, amount: body.amount })
    else if (type === 'blackjack_hit') sock.emit('blackjack_hit', { lobbyId })
    else if (type === 'blackjack_stand') sock.emit('blackjack_stand', { lobbyId })
    else if (type === 'ttt_move') sock.emit('ttt_move', { lobbyId, index: body.index })
    else if (type === 'ttt_reset') sock.emit('ttt_reset', { lobbyId })
    else if (type === 'chat') sock.emit('chat', { lobbyId, text: body.text })
    return
  }
  try {
    const result = await api.play(lobbyId, body)
    window.dispatchEvent(new CustomEvent('jub-play', { detail: result }))
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Play failed'
    window.dispatchEvent(new CustomEvent('jub-play-error', { detail: message }))
    throw err
  }
}
