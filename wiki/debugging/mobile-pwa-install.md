# Browser App Installation

Purpose: explain why the installed-app option may be absent and how the interface handles browser-controlled installation.

Last updated: 2026-10-03

## Observed deployment issue

On 2026-10-03, `https://split-slate.netlify.app/manifest.webmanifest` returned HTTP 200 with
`Content-Type: application/octet-stream`, despite containing a valid JSON web app manifest. Netlify
does not infer the expected manifest media type for this extension on this deployment. The source
`public/_headers` now specifies `Content-Type: application/manifest+json`; the deployed response must
be checked again after publishing. This header mismatch is a possible contributor to missing install
UI, not a confirmed root cause of Brave's behavior on a particular phone.

## Install flow

The production app offers a desktop/mobile install dialog unless it is already in standalone mode
or the visitor previously dismissed or accepted it. Close, Cancel, and Escape cannot dismiss it
during the first two seconds; overlay clicks never dismiss it. If a browser supplies
`beforeinstallprompt`, the app captures it and calls its `prompt()` from the visitor's Install click.
Browsers decide whether and when that event fires; application code cannot force a native prompt.
When no event is available, the Install action displays browser-menu instructions instead.

The production service worker does not run in the Vite development server. PWA browser tests run
against a production build on localhost; a real mobile-browser install rehearsal remains necessary.
See [[product-roadmap]] and [[iconography]] for the offline shell and release checks.
