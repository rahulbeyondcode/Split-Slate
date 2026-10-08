---
name: testing-strategy
description: Test architecture, authoring protocol, and layer boundaries for Split Slate
metadata:
  type: decisions
---

# Decision: Testing Strategy

Purpose: keep accounting tests fast, make every implemented area verifiable, and reserve real
browser coverage for behavior that depends on browser storage, navigation, or offline capability.

Last updated: 2026-10-09

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

## Outstanding Browser Coverage

The 2026-10-08 pre-scaling full browser suite verified the mobile expense form's scroll boundary,
last split row, Save/Cancel toolbar, and absence of a second document/form scroller at 320px by
700px. The bounded form and Categories & Tags routes fix the body as well as clipping overflow.
Root-based mobile scaling was added afterward. Its scale-aware assertions and the later UI fixes
have now been exercised in the completed browser run and focused follow-ups documented below.
A single full-browser run after the final fixes and physical-device validation remain unverified.
Neither runs without explicit user approval. See [[layout-architecture]], [[main-screen]], and
[[product-roadmap]].

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
focus changes; those suites have not been rerun afterward. Physical-device verification remains
pending. See [[layout-architecture]] and [[member-management]].

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
verified in the completed browser run and focused follow-ups above; physical-device validation
remains pending. See [[layout-architecture]].

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
