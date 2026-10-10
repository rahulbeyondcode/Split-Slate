# Split Slate landing page

A standalone static marketing website. It is not part of the expense application or its PWA.

## Files and boundaries

- `index.html` — editorial page, receipt illustrations, scroll story, split demo, and native FAQs.
- `styles.css` — responsive compositions, paper artwork, scene transitions, and motion fallbacks.
- `animations.js` — local, dependency-free progressive enhancement; loaded as a deferred classic script.
- `favicon.svg` — the local brand mark and favicon.

There is no build step, package installation, external font, analytics, PWA manifest, or service
worker. All assets and JavaScript are local. Illustrations use fictional example data, not
screenshots. The interactive split demo is illustrative and never saves expenses or accesses the
application's database. The page uses a warm-paper, violet, and lime visual identity with serif and
sans-serif system fonts, rather than adding downloaded font dependencies.

The app-entry links currently point to `https://split-slate.netlify.app/`. If the app's URL changes,
update every occurrence of that URL in `index.html`. Preserve the app's existing origin where
possible: its browser-local expense data does not automatically move to another origin.

The application does not import this folder, and its Vite build does not copy it into `dist/`.
Keep this folder outside `public/` and do not add it as an app entry point or precache asset.
Repository-wide formatting can still discover the landing files; that is separate from the app build.

## Launch-state copy and promise tracking

The page describes the **approved launch product**, not only the current development build. The
user approved present-tense wording for planned capabilities and intends to release only when
every advertised promise is delivered. No coming-soon or missing-sync disclaimers belong in the
public copy. This does not turn website wording into evidence of a working application feature.

The canonical website-promise ledger is
[`wiki/roadmap/product-roadmap.md`](../wiki/roadmap/product-roadmap.md#website-launch-promise-ledger).
It records exact claims, page locations, current status, missing work, and release evidence.
**Live group updates and continuity on another device are advertised but not implemented yet.**
Group access, identity, pricing, security, conflicts, and recovery need an approved sync design and
implementation before those claims can be cleared. The page does not promise free sync,
account-free cloud participation, automatic currency conversion, or competitor-only features.

The content pass preserves the editorial design and motion while adding an explicit category
description, a create/share/split/repay workflow, concrete travel/roommate/meal use cases, and FAQs
about unequal splits, multiple payers, balances, currency, and portable data. The retained research
is in [`wiki/research/competitive-landscape.md`](../wiki/research/competitive-landscape.md).

Before public launch, review **all** page claims against the actual product and clear the ledger's
unfulfilled promises and verification gates. Manual Netlify deployment does not enforce this gate
automatically. Publication readiness is separate from technical upload instructions below.
The landing page itself never connects to a sync service or the app's database.

## Animation and accessibility boundaries

- Receipt entrance choreography, drawn connections, a moving word ribbon, local pointer tilt,
  and a scroll-driven gather → split → repay scene use native CSS/browser animation APIs.
- The split demo has five keyboard/touch-operable buttons and conserves the ₹1,200 total even
  during animated numeric transitions. It announces the chosen final allocation once, rather than
  making a live announcement for each animation frame.
- The header's motion control disables animation and transitions. Device reduced-motion settings
  take precedence; decorative loops pause offscreen and when the browser tab is hidden.
- No scroll hijacking, custom cursor, forced autoplay of split methods, or external animation CDN.
- The tall sticky scroll narrative only activates on sufficiently wide **and tall** viewports.
  Smaller/shorter viewports get a normal document flow and the final balance illustration.
- Pointer tilt only runs on hover-capable fine-pointer devices. Touch does not depend on hover.
- Without JavaScript, copy, links, and native FAQs remain usable; the demo shows an equal split
  with disabled method buttons. Desktop story artwork becomes interactive only when enhanced.

Responsive rules cover narrow phones, tablets, large screens, and short landscape windows.
The scoped Chromium checks below verify representative viewports, not every physical device or browser.

## Deploy with Netlify drag and drop

1. Create a **separate** manually deployed Netlify site for the landing page. Do not upload it to
   the existing application site.
2. Drag this `landing/` folder into Netlify's manual deployment area. `index.html` must be at the
   uploaded site's root, beside `styles.css`, `animations.js`, and `favicon.svg`.
3. Netlify serves these ready-made static files; no build command is needed.
4. Confirm the app-entry links open the expense application.
5. For later landing changes, upload this folder again to the same landing site.

The app's existing Git-triggered deployments are independent. Pushing the repository does not
automatically update a manually deployed landing site. A `netlify.toml` file is not needed for this
manual deployment; configure its domain and site settings in Netlify's dashboard.

## Preview and verification

For a basic local look, open `index.html` in a browser; the page has no runtime dependencies.
Browser automation, servers, formatting, and other verification require explicit user approval
under the project's execution policy. **The latest competitor-informed copy revision has not been
formatted or browser-verified.** Its CSS and JavaScript are unchanged, but longer/new text needs a
fresh responsive check. The initial version was not verified. Before this content revision, the
redesigned version had the following approved, landing-only results from 2026-10-10:

- `node --check landing/animations.js` passes.
- Eleven Chromium scenarios pass: widths 280, 320, 390, 768, 1024, 1440, and 1920px; touch landscape
  at 844×390; short desktop at 1280×600; reduced motion; and JavaScript disabled.
- The nine viewport scenarios check horizontal/header overflow, app-entry URLs and absence of a
  landing manifest, five split methods and exact intermediate totals, keyboard FAQ/demo operation,
  desktop story stages or normal-flow fallback, the motion toggle, and fine/touch pointer behavior.
  No browser errors or horizontal overflow were found.
- Reduced motion disables animation while keeping the split demo functional. Without JavaScript,
  primary content, app links, and native FAQs remain available; demo controls stay disabled.
- Prettier formatted `index.html`, `styles.css`, and `animations.js`. The approved four-file command
  exited with code 2 because it cannot infer a parser for `favicon.svg`; the SVG was not formatted
  by that command. No alternative parser or retry was run.

Screenshots and machine-readable results: `/tmp/opencode/landing-redesign/`. The temporary local
server was stopped after verification. No application builds, application tests, or installations
were run. These results do not establish Safari/Firefox coverage, real-device performance, or
deployment-specific behavior. Future checks and formatter retries require fresh explicit approval.

## Next phase: SEO

SEO work is explicitly deferred until the page is built and reviewed. The current title and viewport
are basic page scaffolding, not a completed SEO implementation.

After approval, choose the landing site's production domain, then plan search-targeted copy,
description and canonical metadata, social-preview assets, appropriate structured data, sitemap,
crawler rules, Search Console setup, and indexing checks. Do not publish placeholder canonical URLs
or invented reviews, ratings, or usage statistics.

The app's own indexing policy has not been changed. App indexing controls, if wanted, are a
separately approved SEO task; the landing deployment does not automatically apply them to the app.
