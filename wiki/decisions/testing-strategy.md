---
name: testing-strategy
description: Test architecture, authoring protocol, and layer boundaries for Split Slate
metadata:
  type: decisions
---

# Decision: Testing Strategy

Purpose: keep accounting tests fast, make every implemented area verifiable, and reserve real
browser coverage for behavior that depends on browser storage, navigation, or offline capability.

Last updated: 2026-10-11

## Execution Permission — Highest Project Priority

The user controls whether and when verification and routine execution run. Agents must request
explicit approval before tests, builds, lint, type checks, formatting/auto-fixes, Playwright/E2E/PWA,
browser or screenshot automation, watch tasks, development/preview servers, tool installation,
or other routine session-start/task-completion execution. State the commands or bounded batch,
purpose, and expected duration when known; run only the approved scope in the current session.

- **No:** do not execute, retry, or substitute a command to bypass the refusal.
- **Wait:** do not execute; remind the user as requested and ask for approval later. Neither time
  passing nor a reminder grants permission.
- **Yes:** run only the approved scope. A bounded batch does not need approval for each included
  command; additions or retries outside its scope do. A later refusal or deferral overrides earlier
  approval for the affected work. Approval never carries into a new session.

Urgency, failures, pending work, release gates, definitions of done, and "must run first" notes
are reasons to explain a concern, not permission. Approval to edit or commit does not authorize
verification, formatting, installation, or server startup. Read-only inspection for the requested
task is distinct from executing those procedures.

This policy overrides conflicting project instructions and historical notes in `AGENTS.md`,
`CLAUDE.md`, and the wiki. Every command below is conditional on this gate. A denied or deferred
check stays explicitly unverified; do not claim it passed or block unrelated approved work merely
because it is pending. This preserves the user's control over time and the shared workspace.

## Responsive Browser Coverage

The 2026-10-08 pre-scaling full browser suite verified the mobile expense form's scroll boundary,
last split row, Save/Cancel toolbar, and absence of a second document/form scroller at 320px by
700px. The bounded form and Categories & Tags routes fix the body as well as clipping overflow.
Root-based mobile scaling was added afterward. Its scale-aware assertions and the later UI fixes
have now been exercised in the completed browser run and focused follow-ups documented below.
A final full-browser run after those fixes passes on 2026-10-10, including the Analytics change.
The 2026-10-11 stable full suite also verifies the subsequent navigation, editor, and input changes.
See [[layout-architecture]], [[main-screen]], and [[product-roadmap]].

## Decision

Split Slate uses Vitest 4.1 or newer as its primary unit and integration test runner. Vitest runs
through the existing Vite transformation pipeline and supports the project's TypeScript, ESM,
JSX, plugins, and `@/` aliases. Vitest 4 requires Node.js 20 or newer.

React Testing Library is the planned component-testing layer when interactive component coverage
is added. Playwright is installed for browser expense-recording workflows; it is not a substitute
for unit-level accounting tests.

Jest is not used because it would introduce a second transformation and module-resolution setup
beside Vite. TestCafe is not used because it overlaps the end-to-end role assigned to Playwright.

## Directory and File Structure

Tests live in dedicated `tests/` directories rather than beside production files. Every feature
gets a `src/features/<feature>/tests/` directory when its first test is added. Subdirectories mirror
the production structure where that improves navigation:

```text
src/
├── app/
│   └── tests/
│       ├── layouts/
│       └── router/
├── features/
│   └── <feature>/
│       └── tests/
│           ├── components/
│           ├── helpers/
│           ├── hooks/
│           └── store/
└── shared/
    └── tests/
        ├── components/
        ├── configs/
        ├── hooks/
        └── utils/
```

Only directories that contain tests are committed because Git does not retain empty directories.
Unit/integration test files use the production filename followed by `.test.ts` or `.test.tsx`.
Playwright journeys use `.e2e.ts` under feature `tests/browser/` directories or app
`tests/router/`. The main Playwright root is `src/`; its match patterns include both of those
locations, with shared desktop/mobile Chromium projects. PWA production-build tests use a separate
`playwright.pwa.config.ts` configuration and `.pwa.ts` files. Cross-directory imports continue to
use the `@/` alias.

Playwright's Node-side test loader does not apply Vite's asset transformations. Modules that
import images must be loaded inside `page.evaluate` through the running Vite server, not as
runtime imports in the test file. Type-only imports remain safe; return only serializable values
needed for assertions. The carousel layout tests load slide titles and descriptions this way.

## Test Boundaries

Vitest's assigned scope includes:

- monetary parsing, formatting, and validation
- split calculation and deterministic rounding
- balance and settlement-suggestion helpers
- schemas, finite-state transitions, hooks, and other deterministic logic
- store actions and persistence boundaries with controlled IndexedDB state
- component behavior that does not require a complete browser journey

Playwright's assigned scope includes:

- onboarding and group-creation journeys
- expense create, edit, and delete journeys
- persistence across page reloads using real IndexedDB
- import, export, PWA installation, and offline-start behavior
- critical responsive navigation behavior

## Test Authoring Protocol

Before writing a suite:

1. Read `wiki/index.md` and the pages relevant to the behavior under test.
2. Inspect the authoritative production source and its direct consumers.
3. Enumerate the observable contract, invariants, boundaries, and failure paths.
4. Test public behavior instead of private implementation details.
5. Propose the focused suite, `pnpm test`, and `pnpm check`; run only what the user explicitly
   approves under the execution-permission gate. If declined or deferred, report verification pending.

Test writing follows these rules:

- Name each `describe` block after the public unit or workflow and each test after observable
  behavior.
- Keep one behavioral reason for failure per test. Multiple assertions are appropriate when they
  jointly describe one outcome.
- Prefer explicit case tables for finite state transitions and equivalence classes.
- Use small typed fixture builders with fixed IDs and timestamps. Do not share mutable fixtures
  between tests.
- Keep tests deterministic: do not depend on the machine locale, current clock, random UUIDs,
  network, execution order, or data left by another test.
- Mock only external or nondeterministic boundaries. Do not mock the unit being tested or repeat
  its implementation inside the assertion.
- Assert persisted state as well as in-memory state for Dexie-first store mutations.
- Assert user-visible roles, labels, messages, and navigation in component and browser tests;
  avoid CSS selectors and internal React state.

For every behavior, consider all applicable cases from this checklist:

- normal success and every supported variant
- empty, first, last, zero, minimum, maximum, and precision boundaries
- invalid, missing, malformed, duplicate, and cross-entity references
- async rejection, database failure, and partial-write prevention
- repeated calls, idempotency, ordering, and state isolation
- accessibility, keyboard interaction, responsive layout, reload, and offline behavior

Coverage is behavior-based rather than percentage-only. Every executable source area must have
direct unit or integration coverage or be exercised through a higher-level test. Static
declarations, constants, and entry points may be covered through integrity or integration tests
when a direct test would only repeat the source. Any intentional exclusion requires an explicit
rationale.

## Definition of Done for a Test Slice

A test slice is complete when:

These are completion criteria, not authorization to run checks. Ask first; if verification is
declined or deferred, mark the slice unverified and continue only separately approved work.

- its applicable success, boundary, invalid-input, and failure cases are covered
- tests are deterministic and isolated
- the focused suite and complete Vitest suite pass
- ESLint, Prettier, and TypeScript checks pass through `pnpm check`
- any durable behavior or strategy change is reconciled with the wiki

## Current Status

The completed, approved 2026-10-11 verification supersedes the earlier automated baselines:

- `pnpm check` passes ESLint, Prettier, and TypeScript against the final code and tests.
- `pnpm test` passes all 503 cases across 41 files.
- The final stable `pnpm test:e2e` run passes 520 cases with 44 expected viewport-specific skips
  and zero failures (564 scheduled combinations, two workers, 19.7 minutes). It covers both mobile
  expanding navbars, history/viewport resets, editor focus, grouped/capped amounts, shared time
  controls, percentage suffixes, tags, filter colours, dashboard clocks/previews, and compact
  spending layouts in addition to existing accounting, transfer, and CRUD journeys.
- Production and Devtools-enabled builds pass. All 18 production-build PWA cases pass, covering
  offline launch, icon-cache repair, installation, reminders, and update consent.
- JavaScript syntax checks pass for the standalone landing animation and PWA icon generator.
- Artifacts are under `/tmp/opencode/full-verification-2026-10-11`; the clean full-suite log is
  `browser-stable-final.log`. Earlier diagnostic/failing runs are superseded, not counted as passes.

The verification repairs establish these additional invariants:

- Shared editor dialogs close before DOM removal in layout-effect cleanup and explicitly restore
  a connected opener. Passive-effect teardown after removal lost focus. Mobile Contacts must
  override the unlayered `.btn` display rule when hiding the redundant header creation action.
- Single-payer radios and controlled multiple-payer checkboxes need distinct React identities;
  reusing one input across control models emits warnings. Mode switching retains form drafts.
- Browser tests wait for a rendered destination, not just a changed URL or a link's local collapse.
  The history test waits for the destination's `aria-current="page"` before another action.
  Persistence checks and reloads wait for the post-save screen or next onboarding step: a submit
  click alone does not prove the asynchronous IndexedDB write completed. Reloading during Saving
  interrupted a noon/midnight update. Existing saved-value/reset assertions remain intact.
- Source and test files stay frozen during browser verification; edits and formatter writes can
  invalidate a Vite-served run through page reloads. Only stable runs establish the final baseline.

Builds retain non-failing large-chunk, plugin-timing, and service-worker `inlineDynamicImports`
deprecation warnings. These checks do not establish perfection, real-device coverage,
storage-pressure behavior, or a two-deployment update rehearsal. The previous production visual
smoke matrix below was not repeated for these latest changes. Future execution requires approval.
See [[layout-architecture]], [[member-management]], [[people-directory]], and [[paid-by]].

### Previous Completed Baseline (2026-10-10)

The 2026-10-10 verification superseded the older automated baselines below:

- `pnpm check` passes ESLint, Prettier, and TypeScript after the final repairs and scoped
  import-order/formatting fixes.
- `pnpm test` passes all 467 cases across 40 files after the final application fixes.
- `pnpm build` and `VITE_ENABLE_DEVTOOLS=true pnpm build` pass; the final PWA run builds the normal
  production variant again.
- `pnpm test:pwa` passes all 18 cases against the final application changes.
- The first full browser run after the modal/filter/dashboard refinements passed 359 cases,
  skipped 21 inapplicable project combinations, and failed 30. Repairs reduced those failures to
  shared UI defects and selector drift, not 30 independent defects. The four-file focused rerun
  passed all 115 applicable cases with 11 expected skips.
- The final `pnpm test:e2e` run with application source stable passes all 389 applicable cases,
  with 21 expected viewport-specific skips and zero failures (410 scheduled combinations). It covers
  group Analytics drill-down, compact horizontal filter pills, mobile Filters, shared modal margins
  and fixed controls, group identity/currency editing, outer-only expense/payment scrolling,
  compact colour-labelled payment tags, sidebar groups, and aligned dashboard summaries.
- Eight production smoke cases at 280, 320, 390, 640, 820, 1024, 1440, and 1920px pass in alternating
  light/dark themes. Each checks dashboard/pane overflow, member avatars, ledger scrolling, filter
  pills, modal margins/actions, payment tags, saved themes, and offline filtered reloads and editors.
  No browser page errors were observed. Logs, screenshots, and traces are under
  `/tmp/opencode/full-verification-2026-10-10`.

The verification repairs establish these reusable UI constraints:

- Custom unlayered `display` rules override Tailwind's layered hiding utilities. Dashboard preview
  and New group visibility therefore use explicit scoped media rules. Grid cards also need
  `min-width: 0` so long names do not expand their automatic minimum width beyond the main pane.
- Portaled popovers must follow layout changes, not just viewport resize/scroll. Filter edits and
  validation can remove insights or resize the sticky toolbar; render-time updates and observers
  keep the popover outside its trigger so it remains closable. See [[filtering]].
- A custom field's inline error inside a wrapping label changes its accessible name. Group-name
  editing separates the explicit label from the field/error wrapper, keeping the name stable after
  invalid submission and allowing correction without weakening the exact-label regression test.
- Browser tests scope repeated captions and use the current responsive controls: mobile Filters is
  a dialog, while expense Add tag remains intentionally mobile-only. Desktop tag-modal layout is
  exercised through Categories & Tags instead.

Those builds emitted non-failing large-chunk and service-worker option-deprecation warnings; expense
payer browser journeys emitted a React uncontrolled-to-controlled input warning despite passing.
The payer warning is repaired in the 2026-10-11 focused regression documented above.
These automated results do not claim storage-pressure or two-deployment update rehearsal
verification. See [[layout-architecture]] and [[mobile-pwa-install]].

### Earlier Verification History

Earlier on 2026-10-10, before the modal/filter/dashboard refinements, the stable full browser suite
passed 314 cases with 18 expected skips. Seven Analytics smoke cases at 280–1440px and four offline
cases verified category links, filtered reloads, saved themes, and unchanged app-wide Analytics.
Those artifacts remain under `/tmp/opencode/analytics-category-drill-down`; the current full run
supersedes that baseline.

On 2026-10-09, after the onboarding and data-transfer UI changes and execution-approval policy
updates, `pnpm check` and `pnpm build` passed, all 443 Vitest cases passed across 37 files, and
all 18 production-build PWA cases passed. Full browser and responsive visual verification were
pending at that point. These results predate the carousel browser-test import correction.

The subsequent full browser run completed with 258 passing cases, 19 viewport-specific skips,
and 7 failures: missing saved-theme initialization on entry pages, mobile person-editor focus
expectations, and a settlement-height assertion during viewport resizing. Theme initialization
has moved to `App`, with direct-entry regression checks.
The 28 initial responsive captures showed no horizontal overflow and confirmed the theme defect.

All six focused saved-theme/direct-entry browser cases then passed on desktop and mobile.
The shared editor dialog now focuses its first enabled form field after opening, and the
settlement layout test waits for the expected root font size at each viewport before measuring.
The four-worker targeted run passed all seven formerly failing cases. Its long public-entry
matrix exceeded the default test timeout under concurrent cold-start load, so that matrix now
uses separate cases per theme/onboarding state instead of increasing the timeout. All eight
split matrix cases passed the focused follow-up. Together these runs verify 22 current cases:
14 unchanged targeted cases plus the eight split theme cases. The full suite is not automatically
repeated after each fix, and no single post-fix full-suite pass is claimed.

The final 28 responsive captures at 320x568, 390x700 (dark), 900x900, and 1280x800 applied the
correct saved themes, showed no horizontal overflow, and kept modal/currency actions visible.
`VITE_ENABLE_DEVTOOLS=true pnpm build` passed after the final source/test corrections. The typed
onboarding fixture also resolves the TS2353 build failure reported from Netlify; deployment still
requires committing and pushing the local fix. Unit/PWA results above predate the final theme and
focus changes; those suites had not been rerun at that point. See [[layout-architecture]] and
[[member-management]].

On 2026-10-08, before root scaling, `pnpm lint` and `pnpm build` passed, `pnpm test` passed
443 cases across 37 files, and the full `pnpm test:e2e` run passed 207 cases with 19
viewport-specific skips and no failures. This cleared current assertion drift, host-versus-browser
timezone assumptions, the expense/payment timeline's non-date sorting regression, desktop
Add-tag visibility, and mobile document-scroll leaks. Export copied feedback now resets from
selection change events, and its selection ref is synchronized outside render. Browser time
assertions run in the configured browser timezone rather than assuming the Node host timezone.
The 18 PWA production-build cases also passed before the scaling refactor.

After root scaling, lint, build, all 443 unit cases, and all 18 PWA cases passed. The browser run
exposed assertions that assumed unscaled 320px layout: date/time fields now fit side by side at
that width, and the 38px-reference Settle up action measures 33.25px at the 14px root. Date/time
coverage now checks available width against both flex bases and the gap at 320px and 280px;
settlement-button height bounds use the actual root scale. Those corrections were subsequently
verified in the completed browser run and focused follow-ups above. See [[layout-architecture]].

On 2026-10-05, `pnpm check` passed, `pnpm test` passed 422 Vitest cases, the full
`pnpm test:e2e` run passed 154 cases with no failures and 18 viewport-specific skips, and
`pnpm test:pwa` passed 18 production-build cases. That clears the 30 failures recorded on
2026-10-04: transfer journeys now open the collapsed Settings **Export group** panel before
selecting content, remaining assertions match current dates, balances, and dialog markup, and the
update-notice PWA test seeds a timestamp dismissal because legacy boolean values intentionally
re-prompt. This run does not verify mobile Add/Edit Expense scroll-to-last-field or Save/Cancel
placement. See [[product-roadmap]].

Vitest covers the existing helpers and schemas plus money conversion, currency formatting, all five
split methods, expense input validation, and payer defaults/ranking. Expense-store integration tests
use `fake-indexeddb` and assert persisted state, hydration, concurrent writes, stale-reference
rejection, and rollback when either write fails.

`fake-indexeddb` is a development dependency imported by the expense-store tests. It supplies an
in-memory IndexedDB implementation in Node so the real Dexie/store code can exercise persistence
and rollback. The application uses browser IndexedDB; Playwright also uses real browser storage.

Playwright suites are configured for Chromium at desktop and mobile sizes. Expense journeys cover
form recording and editing across all five split methods, multiple payers, detail navigation, tags,
confirmed deletion, list/balance updates, reload persistence, cancellation, retry after rejection,
inactive historical categories, solo balances, and missing/cross-group expense routes. Tests also
cover app-route recovery, dashboard navigation/activity, group deletion, category/member/contact
flows, group transfer, and whole-app backup. PWA tests exercise the production service worker and
offline/cache paths separately. Test data lives in isolated browser contexts. With explicit user
approval for the relevant commands, `pnpm test:e2e` runs browser journeys and `pnpm test:pwa` runs
production-build PWA checks. If Chromium is missing, separately request approval to install it with
`pnpm exec playwright install chromium`; test approval does not implicitly authorize installation.
Traces/results are written under their configured `/tmp`
Playwright output directories. Component tests with React Testing Library remain planned.

### Expected Project-Specific Skips

`playwright.config.ts` schedules the shared browser suites in both desktop and mobile projects.
Some tests exercise UI that exists in only one layout, so `test.skip` excludes the inapplicable
project rather than dropping the behavior from coverage.

The 2026-10-11 final run scheduled 564 test/project combinations:

| Test scope | Count | Skipped project | Passing project |
|------------|-------|-----------------|-----------------|
| Mobile-only UI | 36 | Desktop | Mobile |
| Desktop/sidebar UI | 5 | Mobile | Desktop, including resized sidebar widths |
| Explicit tablet viewport | 3 | Mobile | Desktop, resized to tablet width |

All 44 skipped combinations have a corresponding passing execution in the appropriate project.
Examples include mobile footer navigation, desktop dashboard cards, sidebar rows, and tablet
outer-only ledger scrolling.
These tests remain necessary regression coverage; the skip avoids asserting a layout-specific
contract against a different layout. The result is 520 passing combinations, 44 inapplicable
combinations, and zero failures—not 44 behaviors left untested.

Additional Vitest suites cover form-value round-trips and fixed two-decimal precision across currency labels; all-member balances,
transfer conservation, ID tie-breaking, and safe-integer boundaries; member reference checks,
concurrent duplicate additions, and persisted self-deletion protection. Expense-store tests cover
update ownership and validation, old-total replacement at the aggregate limit, payer-ranking
refresh, timestamp/attachment preservation, attachment cascades, concurrent update/delete, and
rollback when writes fail.

Expense-filter utility tests cover all eight logical fields, cross-field AND and within-field OR
matching, local-calendar inclusivity, all five split types, multi-payer totals, fixed precision,
safe amount bounds, active-field counting, empty inputs, invalid date/amount ranges, and stale-option
pruning. Dedicated desktop/mobile journeys manipulate every filter, assert range validation and
clear behavior, verify child-route state retention, and confirm deletion removes a selected option.

Group-settings browser coverage checks that dismissing the currency warning makes no change,
accepting it relabels an expense without rewriting saved paid/owed amounts, and the UI shows two
decimal places for JPY. Fixed-scale utilities and transfer round-trips have unit coverage.

Ratio regression cases cover exact decimal metadata, minimum and maximum supported shares,
values that Number would round, preserved decimal zeros, six-decimal percentages, and maximum
money totals. Form tests cover legacy numeric metadata and reject an already-rounded out-of-range
legacy ratio without clamping it. Store cases verify hydration and name-only edits preserve
allocations; desktop/mobile browser journeys verify maximum shares in detail, editing, and reload.

Tag-store integration tests in `src/shared/tests/configs/store/tags.test.ts` cover cleanup using
persisted tag/group records, stale deleted or edited expenses, references absent from memory,
preservation of unrelated data and receipts, unused/missing/repeated deletion, concurrent tag
removals, and overlapping expense creation/editing/deletion in both orders. Write-failure cases
verify rollback of the tag and earlier expense changes, unchanged memory, and successful retry.
These tests use fake IndexedDB; stale snapshots simulate another tab's retained state.

Import/export utility and integration suites cover consistent persisted snapshot reads, independent
content selection, expense/receipt dependency closure, omitted-reference cleanup, cross-record and
count validation, paid/owed and aggregate limits, canonical SHA-256 checks, and malformed/tampered
payload rejection. Link cases cover Unicode round-trips, the 32,000-character and 256 KiB guards,
file fallback, and a fixed 25-member/25-category/25-tag/50-expense acceptance fixture. CSV cases
cover deterministic typed rows and spreadsheet escaping. ZIP cases verify manifest/CSV agreement,
declared paths, receipt hashes, missing/surplus/corrupt files, and archives without receipts.

Import-store cases use fake IndexedDB to verify fresh group-owned IDs, internal-reference rewrites,
recipient identity mapping, default categories, same-name numbering, receipt persistence,
preservation of completed onboarding state, post-write counts, and full transaction rollback.
Dedicated desktop/mobile browser journeys exercise questionnaire defaults and dependency dialogs,
format availability, Link/CSV/ZIP generation, fresh-device Link/CSV import, existing-device ZIP
import, identity setup, count-only review, same-name import, and receipt-byte persistence.

This is an inventory of existing suites, not a substitute for running them. Direct browser coverage
for the member-management repeated-add UI guard remains pending; store-level concurrent membership
and aggregate group-spending boundary cases are covered.

With explicit user approval, `pnpm test` performs a single complete run; `pnpm test:watch` is an
optional watch task requiring approval for that persistent process. Neither runs automatically.

## Related

- [[balance-calculation]] — first implemented unit-test target
- [[onboarding-persistence]] — setup-step resume and monotonic-progress invariants
- [[money-representation-and-rounding]] — required accounting edge-case coverage
- [[product-roadmap]] — release-critical workflows and test requirements
