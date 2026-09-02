import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { config } from './config'
import type { InviteClaims, SessionUser } from '../shared/types'

export function signSession(user: SessionUser): string {
  return jwt.sign({ typ: 'session', ...user }, config.jwtSecret, { expiresIn: '7d' })
}

export function verifySession(token: string): SessionUser {
  const decoded = jwt.verify(token, config.jwtSecret) as SessionUser & { typ?: string }
  if (decoded.typ !== 'session' || !decoded.id || !decoded.name) {
    throw new Error('Invalid session')
  }
  return { id: decoded.id, name: decoded.name, guest: Boolean(decoded.guest) }
}

export function signInvite(claims: InviteClaims, ttlMs: number): string {
  return jwt.sign(claims, config.jwtSecret, { expiresIn: Math.ceil(ttlMs / 1000) })
}

export function verifyInvite(token: string): InviteClaims {
  const decoded = jwt.verify(token, config.jwtSecret) as InviteClaims
  if (decoded.typ !== 'invite' || !decoded.lobbyId || !decoded.code) {
    throw new Error('Invalid invite')
  }
  return decoded
}

export function guestUser(name: string): SessionUser {
  const clean = name.trim().slice(0, 24) || `Guest-${randomUUID().slice(0, 4)}`
  return { id: randomUUID(), name: clean, guest: true }
}

export function readBearer(header?: string): string | null {
  if (!header) return null
  const [kind, token] = header.split(' ')
  if (kind !== 'Bearer' || !token) return null
  return token
}
