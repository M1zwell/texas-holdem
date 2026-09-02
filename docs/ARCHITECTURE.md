# Jub Poker hybrid backend

Play-chip social tables. Not real-money gambling.

```
[Browser]
   |  HTTPS same-origin on jubuddy.com
   +-- static + REST /poker/api --> [Cloudflare Worker + Assets] --hydrate--> [Supabase]
   +-- Socket.IO /poker/socket.io --> [CF Worker proxy] --> [Fly.io 256MB VM]  (optional)
   +-- lobby cards --------------------------------------> [Supabase Realtime]
```

| Concern                            | Where                                         |
| ---------------------------------- | --------------------------------------------- |
| DNS, CDN, DDoS, static SPA         | Cloudflare (zone + Worker assets)             |
| REST preview / join / play         | Cloudflare Worker (`handlePokerApi`)          |
| Auth / wallets / lobby list        | Supabase                                      |
| Long-lived Socket.IO + fold timers | Fly.io VM, only if `FLY_SOCKET_ORIGIN` is set |
| Multi-node fanout                  | Redis pub/sub when `REDIS_URL` is set on Fly  |

REST play works without Fly. Set `FLY_SOCKET_ORIGIN=https://<app>.fly.dev` on the Worker when you want the hybrid socket path. Use one `shared-cpu-1x` 256MB machine — do not leave extra always-on VMs running.

## Domain DNS

This agent cannot log into Cloudflare or GoDaddy. After Fly/Netlify gives you a hostname:

**jubuddy.com/poker** — Cloudflare Worker + static assets (`cloudflare/src/worker.ts`, `cloudflare/wrangler.jsonc`). Same-origin on the existing jubuddy.com zone: route `jubuddy.com/poker*` only. Apex `jubuddy.com/` stays the Vercel jubuddy-game app. Lobby/hand state hydrates from Supabase (Workers are isolate-scoped; no Fly VM).

Fly.io is **optional** and already Pay As You Go ($0 plan fee). Unused demo/sandbox apps were removed (markitdown, jubitmind-demo, pi-sandbox, browser-harness). Left running: `zaydenclips-api`, `jubit-litellm-db`, `jubit-litellm-proxy`. miz.gg / m1z.gg wait until GoDaddy login works.

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
