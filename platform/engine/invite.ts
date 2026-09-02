import { randomInt } from 'node:crypto'

/** Crockford base32 minus ambiguous I/L/O/0/1 — 6 chars ≈ 30 bits. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function randomJoinCode(length = 6): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)]
  }
  return out
}

export function normalizeJoinCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[ILO0]/g, (ch) => {
      if (ch === 'I' || ch === 'L' || ch === '1') return '1'
      return '0'
    })
    .replace(/[^A-Z0-9]/g, '')
}

export interface InviteRecord {
  code: string
  lobbyId: string
  hostId: string
  createdAt: number
  expiresAt: number
  singleUse: boolean
  used: boolean
}

export const DEFAULT_INVITE_TTL_MS = 15 * 60 * 1000

export function isInviteLive(
  invite: InviteRecord,
  now = Date.now(),
): { ok: true } | { ok: false; reason: 'expired' | 'used' } {
  if (invite.used && invite.singleUse) {
    return { ok: false, reason: 'used' }
  }
  if (now >= invite.expiresAt) {
    return { ok: false, reason: 'expired' }
  }
  return { ok: true }
}
