import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { Lobby } from './store'
import { store } from './store'
import { rooms } from './rooms/registry'
import type { RoomSnapshot } from './rooms/snapshot'

type Supa = {
  from: (table: string) => any
  channel: (name: string) => any
  rpc: (fn: string, args?: Record<string, unknown>) => any
}

let client: Supa | null | undefined

export function resetSupabaseClient(): void {
  client = undefined
}

function supabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  )
}

export function supabaseEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && supabaseKey())
}

export async function getSupabase(): Promise<Supa | null> {
  if (client !== undefined) return client
  if (!supabaseEnabled()) {
    client = null
    return null
  }
  client = createClient(process.env.SUPABASE_URL!, supabaseKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

export function hashJoinCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function persistLobby(lobby: Lobby): Promise<void> {
  await persistRuntime(lobby)
}

/** Persist lobby metadata + room snapshot so serverless instances can resume. */
export async function persistRuntime(lobby: Lobby): Promise<void> {
  if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL
  }
  if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  }
  if (!supabaseEnabled()) return
  const balances: Record<string, number> = {}
  for (const member of lobby.members) {
    balances[member.id] = store.balances.get(member.id) ?? 0
  }
  const row = {
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
    invite_code: lobby.invite.code,
    payload: { lobby, balances },
    room_state: rooms.serialize(lobby),
  }
  const db = await getSupabase()
  if (db) {
    const rpc = await db.rpc('jub_upsert_lobby', { lobby_row: row })
    if (!rpc?.error) return
    const { error } = await db.from('jub_game_lobbies').upsert({
      id: row.id,
      name: row.name,
      game: row.game,
      host_id: row.host_id,
      host_name: row.host_name,
      status: row.status,
      max_players: row.max_players,
      player_count: row.player_count,
      approval_required: row.approval_required,
      join_token_hash: row.join_token_hash,
      invite_code: row.invite_code,
      payload: row.payload,
      room_state: row.room_state,
      updated_at: new Date().toISOString(),
    })
    if (!error) return
    console.warn('supabase persist lobby', error.message)
  }
  if (!(await persistViaRest(row))) {
    console.warn('supabase persist lobby failed')
  }
}

async function persistViaRest(row: Record<string, unknown>): Promise<boolean> {
  const url = process.env.SUPABASE_URL
  const key = supabaseKey()
  if (!url || !key) return false
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/jub_upsert_lobby`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ lobby_row: row }),
    })
    return res.ok || res.status === 204
  } catch (err) {
    console.warn('supabase persist rest', err instanceof Error ? err.message : err)
    return false
  }
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

export async function loadRuntime(
  id: string,
): Promise<{ lobby: Lobby; roomState: RoomSnapshot | null } | null> {
  const db = await getSupabase()
  if (!db) return null
  const { data, error } = await db.from('jub_game_lobbies').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return rowToRuntime(data)
}

export async function loadRuntimeByCode(
  code: string,
): Promise<{ lobby: Lobby; roomState: RoomSnapshot | null } | null> {
  const db = await getSupabase()
  if (!db) return null
  const { data, error } = await db
    .from('jub_game_lobbies')
    .select('*')
    .eq('invite_code', code.trim().toUpperCase())
    .maybeSingle()
  if (error || !data) return null
  return rowToRuntime(data)
}

export async function listRemoteLobbies(): Promise<
  Array<{
    id: string
    name: string
    game: Lobby['game']
    playerCount: number
    maxPlayers: number
    status: string
  }>
> {
  const db = await getSupabase()
  if (!db) return []
  const { data, error } = await db
    .from('jub_game_lobbies')
    .select('id,name,game,player_count,max_players,status')
    .neq('status', 'closed')
    .order('updated_at', { ascending: false })
    .limit(24)
  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    game: row.game,
    playerCount: row.player_count,
    maxPlayers: row.max_players,
    status: row.status,
  }))
}

function rowToRuntime(row: any): { lobby: Lobby; roomState: RoomSnapshot | null } | null {
  const payload = row.payload as { lobby?: Lobby; balances?: Record<string, number> } | null
  const lobby = payload?.lobby
  if (!lobby?.id || !lobby.invite) return null
  if (!lobby.chats) lobby.chats = []
  if (payload?.balances) {
    for (const [id, bal] of Object.entries(payload.balances)) {
      store.balances.set(id, bal)
    }
  }
  return { lobby, roomState: (row.room_state as RoomSnapshot | null) ?? null }
}
