# ichina.co desks — drop-in for `M1zwell/yok-zhang`

This folder is the **Career** and **Funding** fields for the garden. They are **separate, independent desks**. They merge into **ichina.co**. They do **not** belong to the poker engine in the parent repo. They do **not** live on planet.

- Career: `https://ichina.co/career`
- Funding: `https://ichina.co/funding`

Apply `tree/` onto **https://github.com/M1zwell/yok-zhang** so production can ship both routes.

This cloud agent cannot push to `M1zwell/yok-zhang` (`cursor[bot]` 403). Prefer copying `tree/` onto the garden root over the older `git am` patch.

## Apply

From a yok-zhang checkout, copy `tree/` over the garden root (messages, header, footer, home, site.ts, AuthCta, family-session, `lib/career/*`, `lib/funding/*`, and the `/career` and `/funding` routes).

Then `npm run build` and:

```
node --experimental-strip-types scripts/verify-career-gate.ts
node --experimental-strip-types scripts/verify-funding-gate.ts
```

Static export includes `/career`, `/{locale}/career`, `/funding`, and `/{locale}/funding`. Each HTML is a Google lock (`Continue with Google` via Jubit SSO at `www.jubit.ai/auth/sso`). Each dashboard loads only after `yying2010@gmail.com` is verified with the hub.

## Two desks

Applications, inboxes, drafts, and calendars must not merge.

- A Cyberport job cover (`hr@cyberport.hk`) is not a CIP form.
- A CityU CDTO application is not a HK Tech 300 Seed form.
- A Meitu CVC job is not a raise email.
- When you reply APPROVE, name a **career** draft or a **funding** draft — never both letters in one email.

Funding raises for **ichina.co** (the garden and the live AI products it holds). Not a poker raise. Not a planet-only raise.

**Working experience (owner desks, not the public lock):** IM / Director / OMO / RO at a China top-15 quantitative fund (name confidential); Founder & Executive Director of live AI products; offshore hedge trading fund since 2025-09. Prior: Tongfang VP/RO, Huatai Distribution/Wealth/RO. Do not put Yunrui/Ruitian on this garden.

**Access:** both routes are only for `yying2010@gmail.com` after Google via `www.jubit.ai/auth/sso`. Public nav / footer / home do not link them until the owner is in. Other accounts see a locked desk. The pages are `noindex`.

Desks are device-local, with **separate** `localStorage` keys. Draft ids live in a client chunk after the owner is in. Do not treat them as a server secret on a static export.
