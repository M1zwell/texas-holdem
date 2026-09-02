-- Jub Poker social play-chip schema (Supabase / Postgres)
-- Isolated table prefix jub_* so it can live beside other projects.
-- Apply in SQL Editor or: supabase db query < supabase/schema-migration.sql

create extension if not exists pgcrypto;

create table if not exists public.jub_wallets (
  user_id uuid primary key,
  display_name text not null,
  balance numeric(20, 4) not null default 5000 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.jub_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.jub_wallets (user_id) on delete cascade,
  lobby_id uuid,
  amount numeric(20, 4) not null,
  balance_before numeric(20, 4) not null,
  balance_after numeric(20, 4) not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.jub_game_lobbies (
  id uuid primary key,
  name text not null,
  game text not null check (game in ('holdem', 'baccarat', 'tictactoe', 'blackjack', 'fortyfive')),
  host_id uuid not null,
  host_name text not null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'closed')),
  max_players int not null default 6,
  player_count int not null default 1,
  approval_required boolean not null default false,
  join_token_hash text not null,
  server_seed_hash text,
  client_seed text,
  server_seed_revealed text,
  deck_shuffled_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jub_game_lobbies_status_idx on public.jub_game_lobbies (status, created_at desc);

create table if not exists public.jub_hand_action_logs (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.jub_game_lobbies (id) on delete cascade,
  hand_id int not null,
  action_sequence int not null,
  actor_id text not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (lobby_id, hand_id, action_sequence)
);

create table if not exists public.jub_ai_generations (
  id uuid primary key default gen_random_uuid(),
  generation int not null,
  theta_c double precision[] not null,
  theta_r double precision[] not null,
  rank int,
  created_at timestamptz not null default now()
);

alter table public.jub_wallets enable row level security;
alter table public.jub_wallet_transactions enable row level security;
alter table public.jub_game_lobbies enable row level security;
alter table public.jub_hand_action_logs enable row level security;
alter table public.jub_ai_generations enable row level security;

drop policy if exists jub_lobbies_public_read on public.jub_game_lobbies;
create policy jub_lobbies_public_read on public.jub_game_lobbies
  for select using (status <> 'closed');

drop policy if exists jub_wallets_owner_read on public.jub_wallets;
create policy jub_wallets_owner_read on public.jub_wallets
  for select using (auth.uid() = user_id);

-- Realtime: lobby cards on the home page
do $$
begin
  execute 'alter publication supabase_realtime add table public.jub_game_lobbies';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Serverless runtime: hydrate lobbies + room snapshots across Vercel instances
alter table public.jub_game_lobbies add column if not exists invite_code text;
alter table public.jub_game_lobbies add column if not exists payload jsonb;
alter table public.jub_game_lobbies add column if not exists room_state jsonb;
create index if not exists jub_game_lobbies_invite_code_idx on public.jub_game_lobbies (invite_code);

create or replace function public.jub_upsert_lobby(lobby_row jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.jub_game_lobbies (
    id, name, game, host_id, host_name, status, max_players, player_count,
    approval_required, join_token_hash, invite_code, payload, room_state, updated_at
  ) values (
    (lobby_row->>'id')::uuid,
    lobby_row->>'name',
    lobby_row->>'game',
    (lobby_row->>'host_id')::uuid,
    lobby_row->>'host_name',
    coalesce(lobby_row->>'status', 'waiting'),
    coalesce((lobby_row->>'max_players')::int, 6),
    coalesce((lobby_row->>'player_count')::int, 1),
    coalesce((lobby_row->>'approval_required')::boolean, false),
    coalesce(lobby_row->>'join_token_hash', ''),
    lobby_row->>'invite_code',
    lobby_row->'payload',
    lobby_row->'room_state',
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    game = excluded.game,
    host_id = excluded.host_id,
    host_name = excluded.host_name,
    status = excluded.status,
    max_players = excluded.max_players,
    player_count = excluded.player_count,
    approval_required = excluded.approval_required,
    join_token_hash = excluded.join_token_hash,
    invite_code = excluded.invite_code,
    payload = excluded.payload,
    room_state = excluded.room_state,
    updated_at = now();
end;
$$;

grant execute on function public.jub_upsert_lobby(jsonb) to anon, authenticated, service_role;
