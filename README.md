# Jub Poker · 聚牌

Online multiplayer **Texas Hold'em**, **Baccarat**, **Blackjack**, **45-Bust**, and **Tic-Tac-Toe** on this house engine. Hybrid: Fly.io stateful Socket.IO + Supabase Realtime lobby cards.

Play-chip social tables only — no real-money wagering.

目标部署 / intended hosts:

- https://jubuddy.com/poker (Cloudflare Worker route; apex stays Vercel)
- http://miz.gg/ — live Netlify site `jub-poker` (`https://jub-poker.netlify.app`)
- https://m1z.gg (DNS not pointed yet)

`https://github.com/M1zwell/poker.git` is the intended sibling product repo. It is **not reachable** (GitHub 404, including authenticated clone). This repository (`M1zwell/texas-holdem`, fork of `themez/texas-holdem-house`) is therefore the implementation home until that remote exists.

## Stack

| Layer    | Choice                                                                       |
| -------- | ---------------------------------------------------------------------------- |
| Engine   | Pure TypeScript: 64-bit card masks, side pots, baccarat tableau, minimax TTT |
| AI       | Monte Carlo equity; 10-d / 80-param genetic policy (CPU); TTT minimax        |
| API      | Express + JWT session + signed invite tokens + rate limits                   |
| Realtime | Socket.IO for hands; Supabase Realtime for lobby list (`jub_game_lobbies`)   |
| Data     | Supabase Postgres + RLS (`supabase/schema-migration.sql`)                    |
| Sync     | Dual Redis pub/sub when `REDIS_URL` is set; in-process bus otherwise         |
| UI       | Vite + React (felt table, streamer blur, host approval waitlist)             |

## Private lobby security

1. Host creates a room → 6-char Crockford join code + 15-minute signed JWT link (never a raw lobby id).
2. Guest hits **preview** (REST). No WebSocket yet. Failures distinguish expired / full / already playing.
3. Guest **confirms join**. Optional host-approval waitlist and one-use codes.
4. Host can **regenerate** the code (old links die) and enable **streamer blur**.
5. Only then does the client open Socket.IO with the session JWT.

## Develop

```bash
npm install
npm test
npm run dev
```

- Web: http://localhost:5173
- API / WS: http://localhost:8080

```bash
npm run build && npm start   # serves the built UI from Express
```

## Docker / deploy

```bash
docker compose up --build
```

**jubuddy.com/poker**

```bash
export BASE_PATH=/poker
export VITE_BASE_PATH=/poker/
export PUBLIC_URL=https://jubuddy.com
docker compose up --build
```

Point the existing jubuddy host at `nginx/poker.conf` (`location /poker/` + Socket.IO upgrade).

**m1z.gg**

```bash
export BASE_PATH=
export VITE_BASE_PATH=/
export PUBLIC_URL=https://m1z.gg
docker compose up --build
```

Use the `m1z.gg` server block in `nginx/poker.conf`.

Set `JWT_SECRET` in production. Redis is optional but required for multi-node WebSocket consistency.

## Library (original bot engine)

```ts
import {
  startGame,
  Player,
  CallPlayer,
  RandomPlayer,
  SimpleStratetyPlayer,
} from 'texas-holdem-house'
```

The house engine in `src/` is unchanged in spirit: clockwise dealer / SB / BB, raise sizing, and side-pot collection. The live site uses the state-machine port in `platform/engine/holdem.ts` so humans and sockets can drive one action at a time.

## Tests

```bash
npm test
```

Covers hand ranking, side pots / chip conservation, baccarat tableau, minimax TTT, invite expiry, and lobby preview/approval.
