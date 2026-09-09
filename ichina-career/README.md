# ichina.co/career — drop-in for `M1zwell/yok-zhang`

This folder is the career field for the garden. It does **not** belong to the poker engine in the parent repo. Apply it onto **https://github.com/M1zwell/yok-zhang** so production `ichina.co/career` can ship.

This cloud agent cannot push to `M1zwell/yok-zhang` (`cursor[bot]` 403). The patch was committed locally on that clone as `cursor/career-tacit-field-ea80` (`0266f57`).

## Apply

From a yok-zhang checkout:

```bash
git am path/to/ichina-career/0001-Add-career-as-a-Polanyi-tacit-field-on-the-garden.patch
```

Or copy `tree/` over the garden root (messages, header, footer, home, site.ts, and the new `/career` routes).

Then `npm run build`. Static export includes `/career` and `/{locale}/career`.

## What it is

Polanyi: *we know more than we can tell*. Live products are the CV. Ranked Hong Kong roles are gravity. A Hong Kong clock and a local **Desk** (`?desk=1`) hold apply notes and Gmail draft ids. Current employer stays off the public page. No email is sent from this page.

Desk is device-local (`localStorage`). Do not treat draft ids as secret; they are in the client bundle.
