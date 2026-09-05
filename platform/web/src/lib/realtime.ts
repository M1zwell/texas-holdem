import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'
import type { GameKind } from '@shared/types'

export interface LiveLobby {
  id: string
  name: string
  game: GameKind
  player_count: number
  max_players: number
  status: string
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let browserClient: SupabaseClient | null = null

export function supabaseBrowser(): SupabaseClient | null {
  if (!url || !anon) return null
  if (!browserClient) {
    browserClient = createClient(url, anon, { auth: { persistSession: false } })
  }
  return browserClient
}

/** Subscribe to jub_game_lobbies inserts/updates for the home-page lobby cards. */
export function subscribeLobbies(onRows: (rows: LiveLobby[]) => void): () => void {
  const sb = supabaseBrowser()
  if (!sb) return () => undefined
  let channel: RealtimeChannel | null = null
  const refresh = async () => {
    const { data } = await sb
      .from('jub_game_lobbies')
      .select('id,name,game,player_count,max_players,status')
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(24)
    if (data) onRows(data as LiveLobby[])
  }
  void refresh()
  channel = sb
    .channel('jub-lobbies')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jub_game_lobbies' }, () => {
      void refresh()
    })
    .subscribe()
  return () => {
    if (channel) void sb.removeChannel(channel)
  }
}

/** Push table updates when jub_game_lobbies rows change (no Fly Socket.IO). */
export function subscribeTable(lobbyId: string, onChange: () => void): () => void {
  const sb = supabaseBrowser()
  if (!sb || !lobbyId) return () => undefined
  const channel = sb
    .channel(`jub-table-${lobbyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jub_game_lobbies', filter: `id=eq.${lobbyId}` },
      () => onChange(),
    )
    .subscribe()
  return () => {
    void sb.removeChannel(channel)
  }
}
