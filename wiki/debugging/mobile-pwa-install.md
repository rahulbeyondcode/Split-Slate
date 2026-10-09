# Browser App Installation

Purpose: explain why the installed-app option may be absent and how the interface handles browser-controlled installation.

Last updated: 2026-10-10

## Observed deployment issue

On 2026-10-03, `https://split-slate.netlify.app/manifest.webmanifest` returned HTTP 200 with
`Content-Type: application/octet-stream`, despite containing a valid JSON web app manifest. Netlify
does not infer the expected manifest media type for this extension on this deployment. The source
`public/_headers` now specifies `Content-Type: application/manifest+json`; the deployed response must
be checked again after publishing. This header mismatch is a possible contributor to missing install
UI, not a confirmed root cause of Brave's behavior on a particular phone.

## Install flow

The production app offers a desktop/mobile install dialog unless it is already in standalone mode,
the visitor accepted the browser's install prompt, or the visitor dismissed the dialog in the last
five days. Dismissal saves a timestamp in `split-slate-install-dismissed`; older saved `"true"`
values are treated as expired, so visitors affected by the former permanent dismissal can see the
dialog again. On a later page load after five days, the dialog is eligible to appear again. Settings
also has an Install app action that opens the dialog immediately after a dismissal. Close, Cancel,
and Escape cannot dismiss it during the first two seconds; overlay clicks never dismiss it. If a
browser supplies `beforeinstallprompt`, the app captures it even while the dialog is hidden and
calls its `prompt()` from the visitor's Install click. Browsers decide whether and when that event
fires; application code cannot force a native prompt. When no event is available, the Install
action displays browser-menu instructions instead. Accepted installation is tracked separately
from temporary dismissal so it does not trigger five-day reminders.

The production service worker does not run in the Vite development server. PWA browser tests run
against a production build on localhost.
See [[product-roadmap]] and [[iconography]] for the offline shell and release checks.
