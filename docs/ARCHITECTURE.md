# Jub Poker hybrid backend

Play-chip social tables. Not real-money gambling.

```
[Browser] --REST preview/join--> [Fly.io Node engine]
        \--Socket.IO actions--/         |
        \--Supabase Realtime lobby cards-/
                                        v
                              [Supabase Postgres + Auth]
                              wallets, lobbies, hand logs
```

| Concern                           | Where                                                 |
| --------------------------------- | ----------------------------------------------------- |
| Auth / wallets / lobby list / RLS | Supabase                                              |
| Lobby live cards                  | Supabase Realtime (`jub_game_lobbies`)                |
| Deal, timers, legal actions       | Fly.io / local Node (stateful)                        |
| Multi-node fanout                 | Redis pub/sub when `REDIS_URL` is set                 |
| Invite preview                    | Express on the stateful node (or later Edge Function) |

Edge Functions are a poor home for 15s fold timers. Keep the state machine in a always-on VM (`fly.toml` `auto_stop_machines = "off"`).

## Domain DNS

This agent cannot log into Cloudflare or GoDaddy. After Fly/Netlify gives you a hostname:

**jubuddy.com/poker** — Cloudflare Worker + static assets (`cloudflare/src/worker.ts`, `cloudflare/wrangler.jsonc`). Same-origin on the existing jubuddy.com zone: route `jubuddy.com/poker*` only. Apex `jubuddy.com/` stays the Vercel jubuddy-game app. Lobby/hand state hydrates from Supabase (Workers are isolate-scoped; no Fly VM).

Fly.io is **optional**. The personal org is overdue; cancel/limit that plan in the Fly dashboard if you want to stop the ~$35/mo bill. Do not convert a legacy Hobby plan to Pay As You Go if you still want the 3×256MB free allowance — and do not overwrite `zaydenclips-api` / `jubit-litellm-*`. miz.gg / m1z.gg wait until GoDaddy login works.

**m1z.gg** — in Cloudflare or GoDaddy add:

- `CNAME @` → your Fly app (`jub-poker.fly.dev`) or the static host
- or `A/AAAA` if you terminate TLS on a VPS

You (or whoever has the registrar/CDN login) must save those records. I can prepare the values; I cannot click Save in those dashboards.

## Apply schema

Paste `supabase/schema-migration.sql` into the Supabase SQL editor, then set:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
