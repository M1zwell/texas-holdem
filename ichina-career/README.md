# ichina.co/career — drop-in for `M1zwell/yok-zhang`

This folder is the career field for the garden. It does **not** belong to the poker engine in the parent repo. Apply it onto **https://github.com/M1zwell/yok-zhang** so production `ichina.co/career` can ship.

This cloud agent cannot push to `M1zwell/yok-zhang` (`cursor[bot]` 403). Prefer copying `tree/` onto the garden root over the older `git am` patch.

## Apply

From a yok-zhang checkout, copy `tree/` over the garden root (messages, header, footer, home, site.ts, AuthCta, family-session, `lib/career/*`, and the `/career` routes).

Then `npm run build` and `node --experimental-strip-types scripts/verify-career-gate.ts`. Static export includes `/career` and `/{locale}/career`. The HTML is a Google lock (`Continue with Google` via Jubit SSO at `www.jubit.ai/auth/sso`). The dashboard loads only after `yying2010@gmail.com` is verified with the hub.

## What it is

Polanyi: *we know more than we can tell*. Live products are the CV. Ranked Hong Kong roles are gravity.

After Google sign-in as `yying2010@gmail.com`, the desk is a hunt dashboard: schedule, reminders, status, progress, pools, matching. Hunt state stays in `localStorage` on this device. Drafts wait in Gmail. Nothing is sent from this page.

**Working experience (owner desk, not the public lock):** IM / Director / OMO / RO at a China top-15 quantitative fund (name confidential); Founder & Executive Director of live AI products; offshore hedge trading fund since 2025-09. Prior: Tongfang VP/RO, Huatai Distribution/Wealth/RO. Do not put Yunrui/Ruitian on this garden.

**Access:** `https://ichina.co/career` is only for `yying2010@gmail.com` after Google via `www.jubit.ai/auth/sso`. Public nav / footer / home do not link it. Other accounts see a locked desk. The page is `noindex`.

Desk is device-local. Draft ids live in a client chunk after the owner is in. Do not treat them as a server secret on a static export.
