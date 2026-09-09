# ichina.co/career — drop-in for `M1zwell/yok-zhang`

This folder is the career field for the garden. It does **not** belong to the poker engine in the parent repo. Apply it onto **https://github.com/M1zwell/yok-zhang** so production `ichina.co/career` can ship.

This cloud agent cannot push to `M1zwell/yok-zhang` (`cursor[bot]` 403). The patch was committed locally on that clone as `cursor/career-tacit-field-ea80` (`0266f57`).

## Apply

From a yok-zhang checkout:

```bash
git am path/to/ichina-career/0001-Add-career-as-a-Polanyi-tacit-field-on-the-garden.patch
```

Or copy `tree/` over the garden root (messages, header, footer, home, site.ts, AuthCta, family-session, and the new `/career` routes).

Then `npm run build` and `node --experimental-strip-types scripts/verify-career-gate.ts`. Static export includes `/career` and `/{locale}/career`. The HTML is a Jubit lock; the field loads only after `yying2010@gmail.com` is verified with the hub.

## What it is

Polanyi: *we know more than we can tell*. Live products are the CV. Ranked Hong Kong roles are gravity. A Hong Kong clock and a local **Desk** (`?desk=1`) hold apply notes and Gmail draft ids. Current employer stays off the page. No email is sent from this page.

**Access:** `https://ichina.co/career` is only for `yying2010@gmail.com` after Jubit OAuth (Google via `www.jubit.ai/auth/sso`). Public nav / footer / home do not link it. Other Jubit accounts see a locked desk. The page is `noindex`.

Desk is device-local (`localStorage`). Draft ids live in a client chunk after the owner is in. Do not treat them as a server secret on a static export.
