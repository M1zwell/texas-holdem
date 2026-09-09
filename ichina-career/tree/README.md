# Yok Zhang

Digital garden for Yok Zhang — Hong Kong. Builds AI. Lives the rest.

Static Next.js (App Router). Notes in `content/posts/`. No backend, no CMS, no env secrets.

Intended production domain: **ichina.co** (apex). Current Vercel deploy: `yok-zhang.vercel.app`. Parent attaches the apex in Vercel — this repo does not mint DNS.

The improved dseek mark lives on this garden only — it is not deployed to dseek.ai.

## Routes

- `/` garden home (English, unprefixed)
- `/hometown` 秀陇张茂文房 — hourglass tree, 字辈, attested map, family 报到
- `/writing` one stream: notes, research theme chips, and the live dseek research desk
- `/writing/[slug]` notes
- `/blog` redirects to `/writing` (old links)
- `/tools` workspace (tacit — universe launcher, HK district jump, live frames)
- `/products` live product directory; city-planet / worlds first
- `/career` private tacit career field — Jubit OAuth, only `yying2010@gmail.com`
- `/share` omni-channel publish desk (YouTube / TikTok / Xiaohongshu / X copy kits)
- `/auth/callback` family SSO return from jubit.ai — exchanges `sso_token`, keeps the session on ichina
- `/tools` and Writing: Studio outputs via jubit.ai/terminal (NotebookLM-class)
- `/{locale}/...` marketing UI in 简体 / 繁體 / 日本語 / 한국어 / ไทย / Nederlands  
  Examples: `/zh-Hans/writing`, `/ja/products`, `/ko`, `/th/tools`, `/nl/writing`, `/zh-Hant`

Locale is stored in a `locale` cookie and reflected in the URL. Default English has no prefix. Markdown post bodies stay English.

## How to run

1. Install Node dependencies in this folder.

2. Start the development server (port 3100). Script name: `dev`

3. Open http://localhost:3100

4. Production: run the build script. Static files land in `out/` (output export is on).

Sign in / Register send you through `www.jubit.ai/auth/sso` with `redirect_uri=https://ichina.co/…`. After Google, the hub returns to `/auth/callback?sso_token=…` (or the page in `redirect_uri`). The garden exchanges that token with the public hub function (same contract as dseek) and stores the session in `localStorage`. No extra env secrets.

`/career` is not a public garden page. It stays off the public nav. The lock asks for Jubit sign-in. After exchange, the garden checks the hub user and only `yying2010@gmail.com` sees the field. Other signed-in accounts are refused. Static export still emits a JS chunk; the door is the session, not a server ACL.

Family check-in on `/hometown` is optional. Apply `supabase/hometown_checkins.sql` in Supabase, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the deploy. Without them the tree still ships; the 报到 form stays quiet.

This is Yok Zhang personal brand and garden site.
