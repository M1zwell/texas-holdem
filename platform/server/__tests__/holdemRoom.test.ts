import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { HoldemRoom } from '../rooms/holdemRoom'
import { store } from '../store'

/**
 * The bug this guards: on a serverless host the next hand is dealt by whichever
 * isolate answers the poll that notices the last one ended. Each isolate used to
 * shuffle its own deck, persist its own hand N, and a player's polls alternated
 * between two forks of the same table. Two rooms hydrated from ONE snapshot must
 * now deal the SAME hand N.
 */
describe('HoldemRoom across isolates', () => {
  const env = process.env.CLOUDFLARE_WORKER
  // Serverless mode: bots act synchronously on flush(), no timers to await.
  beforeAll(() => {
    process.env.CLOUDFLARE_WORKER = '1'
  })
  afterAll(() => {
    if (env === undefined) delete process.env.CLOUDFLARE_WORKER
    else process.env.CLOUDFLARE_WORKER = env
  })

  function lobbyWithBots() {
    const host = store.upsertUser({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Host',
      guest: true,
    })
    return {
      host,
      lobby: store.createLobby({
        host,
        name: 'Fork test',
        game: 'holdem',
        maxPlayers: 6,
        approvalRequired: false,
        singleUseInvites: false,
        streamerMode: false,
        fillBots: true,
      }),
    }
  }

  it('two rooms hydrated from the same snapshot deal the same next hand', () => {
    const { host, lobby } = lobbyWithBots()
    const a = new HoldemRoom(lobby)
    a.maybeStart()
    expect(a.table.handId).toBe(1)

    // End hand 1: the human folds, the bots play it out among themselves.
    a.act(host.id, { type: 'fold' })
    for (let i = 0; i < 6 && a.table.status !== 'handOver'; i++) a.flush()
    expect(a.table.status).toBe('handOver')

    // Make the 3.5 s hand-over pause look elapsed, then snapshot — this is the
    // persisted row both isolates will read.
    a.handOverAt = Date.now() - 10_000
    const persisted = a.serialize()
    expect(persisted.dealSecret).toMatch(/^[0-9a-f]{64}$/)

    // Isolate B has never seen this table. It hydrates the row; flush() inside
    // hydrate() notices the pause is over and deals hand 2. Isolate A does the
    // same on its next request.
    const b = new HoldemRoom(lobby)
    b.hydrate(persisted)
    a.flush()

    expect(a.table.handId).toBe(2)
    expect(b.table.handId).toBe(2)
    expect(b.serialize().table.deck).toEqual(a.serialize().table.deck)
    expect(b.serialize().table.seats.map((s) => s.hole)).toEqual(
      a.serialize().table.seats.map((s) => s.hole),
    )
    expect(b.serialize().table.board).toEqual(a.serialize().table.board)
  })

  it('a fresh room deals a different deck than another fresh room — secrets are per room', () => {
    // Otherwise every table on the platform would deal identical hands.
    const one = new HoldemRoom(lobbyWithBots().lobby)
    const two = new HoldemRoom(lobbyWithBots().lobby)
    one.maybeStart()
    two.maybeStart()
    expect(one.serialize().table.deck).not.toEqual(two.serialize().table.deck)
  })

  it('never leaks the deal secret through the public state', () => {
    const { host, lobby } = lobbyWithBots()
    const room = new HoldemRoom(lobby)
    room.maybeStart()
    const json = JSON.stringify(room.publicState(host.id))
    expect(json).not.toContain(room.dealSecret)
    expect(json).not.toContain('dealSecret')
  })

  it('a snapshot from before secrets existed still hydrates, and mints one', () => {
    const { lobby } = lobbyWithBots()
    const a = new HoldemRoom(lobby)
    a.maybeStart()
    const legacy = { ...a.serialize() }
    delete (legacy as { dealSecret?: string }).dealSecret
    const b = new HoldemRoom(lobby)
    b.hydrate(legacy)
    expect(b.table.handId).toBe(1)
    expect(b.serialize().dealSecret).toMatch(/^[0-9a-f]{64}$/)
  })
})
