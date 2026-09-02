import { createHash } from 'node:crypto'
import type { Lobby } from './store'

type Supa = {
  from: (table: string) => any
  channel: (name: string) => any
}

let client: Supa | null | undefined

export function supabaseEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function getSupabase(): Promise<Supa | null> {
  if (client !== undefined) return client
  if (!supabaseEnabled()) {
    client = null
    return null
  }
  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

export function hashJoinCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/** Persist lobby metadata so the home page can live-subscribe via Realtime. */
export async function persistLobby(lobby: Lobby): Promise<void> {
  const db = await getSupabase()
  if (!db) return
  const { error } = await db.from('jub_game_lobbies').upsert({
    id: lobby.id,
    name: lobby.name,
    game: lobby.game,
    host_id: lobby.hostId,
    host_name: lobby.hostName,
    status: lobby.status,
    max_players: lobby.maxPlayers,
    player_count: lobby.members.length,
    approval_required: lobby.approvalRequired,
    join_token_hash: hashJoinCode(lobby.invite.code),
    updated_at: new Date().toISOString(),
  })
  if (error) console.warn('supabase persist lobby', error.message)
}

export async function persistHandAction(args: {
  lobbyId: string
  handId: number
  sequence: number
  actorId: string
  action: string
  payload?: unknown
}): Promise<void> {
  const db = await getSupabase()
  if (!db) return
  const { error } = await db.from('jub_hand_action_logs').insert({
    lobby_id: args.lobbyId,
    hand_id: args.handId,
    action_sequence: args.sequence,
    actor_id: args.actorId,
    action: args.action,
    payload: args.payload ?? {},
  })
  if (error) console.warn('supabase persist action', error.message)
}
