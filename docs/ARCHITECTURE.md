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

REST play works without Fly. Table sync uses **Supabase Realtime** (`postgres_changes` on `jub_game_lobbies`) so guests see Start/Deal/fold without Socket.IO. Set `FLY_SOCKET_ORIGIN=https://<app>.fly.dev` on the Worker only if you want the optional Fly Socket.IO path. Use one `shared-cpu-1x` 256MB machine — do not leave extra always-on VMs running.

## Domain DNS

This agent cannot log into Cloudflare or GoDaddy. After Fly/Netlify gives you a hostname:

**jubuddy.com/poker** — live Cloudflare Worker `jubuddy-poker` (`jubuddy-poker.yying2010.workers.dev`) with zone routes `jubuddy.com/poker*` and `www.jubuddy.com/poker*` only. Apex `jubuddy.com/` stays the Vercel jubuddy-game app. Assets `html_handling` is `none` so `/poker` is not 307'd onto the Vercel `/`. Lobby/hand state hydrates from Supabase.

Fly.io is **optional** and Pay As You Go ($0 plan fee). New CLI login: **elliot1985@hotmail.com** / org **Elliot** (`https://fly.io/dashboard/elliot-562`). Creating `jub-poker` is blocked until a payment method is added. After a card is on file, `npm run deploy:fly` creates one 256MB machine with no volume and `auto_stop_machines=stop`. Then set Worker secret `FLY_SOCKET_ORIGIN=https://jub-poker.fly.dev`.

Do **not** deploy poker on the old `yying2010@gmail.com` org (overdue invoices). That org still has only `zaydenclips-api`. A leftover `FLY_API_TOKEN` from the old org overrides `flyctl auth login` — `scripts/fly-deploy.sh` unsets it.

**http://miz.gg/** — live on Netlify site `jub-poker` (`https://jub-poker.netlify.app`). Apex DNS (`75.2.60.5`) was already at Netlify; `miz.gg` was moved off `zaydenclips` (kept, primary `gozayden.com`) onto this poker site. `www.miz.gg` CNAMEs to `miz.gg`. HTTPS cert may still be provisioning after the domain move. Function `netlify/functions/api.ts` serves `/api/*` via `config.path` (do not rewrite to `/.netlify/functions/api/:splat`).

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
