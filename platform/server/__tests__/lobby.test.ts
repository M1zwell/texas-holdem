import { describe, expect, it } from 'vitest'
import { MemoryStore } from '../store'

describe('private lobby store', () => {
  it('creates a signed-code room and requires preview before join', () => {
    const store = new MemoryStore()
    const host = store.upsertUser({ id: 'h', name: 'Host', guest: true })
    const lobby = store.createLobby({
      host,
      name: 'Night table',
      game: 'holdem',
      maxPlayers: 6,
      approvalRequired: true,
      singleUseInvites: false,
      streamerMode: false,
      fillBots: true,
      blinds: { small: 50, big: 100 },
    })
    const preview = store.previewByCode(lobby.invite.code)
    expect(preview.name).toBe('Night table')
    expect(preview.approvalRequired).toBe(true)
    const guest = store.upsertUser({ id: 'g', name: 'Guest', guest: true })
    const join = store.requestJoin(lobby.id, guest)
    expect(join.waitlisted).toBe(true)
    expect(lobby.members).toHaveLength(1)
    store.approve(lobby.id, host.id, guest.id)
    expect(lobby.members.map((m) => m.id)).toContain('g')
  })

  it('regenerate invalidates the previous code', () => {
    const store = new MemoryStore()
    const host = store.upsertUser({ id: 'h', name: 'Host', guest: true })
    const lobby = store.createLobby({
      host,
      name: 'x',
      game: 'tictactoe',
      maxPlayers: 2,
      approvalRequired: false,
      singleUseInvites: false,
      streamerMode: true,
      fillBots: false,
    })
    const old = lobby.invite.code
    store.regenerateInvite(lobby.id, host.id)
    expect(() => store.previewByCode(old)).toThrow(/Invalid invite code/)
    expect(store.previewByCode(lobby.invite.code).lobbyId).toBe(lobby.id)
  })
})
