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

**jubuddy.com/poker** — Fly.io stateful Node (`fly.toml`, region `sin`, `auto_stop_machines = "off"`) is the live engine. `scripts/fly-up.sh` creates `jub-poker` and deploys. Cloudflare Worker `cloudflare/poker-worker.js` routes `jubuddy.com/poker*` to `jub-poker.fly.dev` and keeps the `/poker` prefix (same-origin, no GoDaddy). Apex `jubuddy.com/` stays the existing jubuddy-game Vercel app.

Fly org `personal` (`yying2010@gmail.com`) currently **cannot create new apps** until overdue invoices are paid: https://fly.io/dashboard/yying2010-gmail-com/billing — do not overwrite `zaydenclips-api`, `jubit-litellm-*`, or `jubit-pi-sandbox`. miz.gg / m1z.gg wait until GoDaddy login works.

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
