---
name: testing-strategy
description: Test architecture, authoring protocol, and layer boundaries for Split Slate
metadata:
  type: decisions
---

# Decision: Testing Strategy

Purpose: keep accounting tests fast, make every implemented area verifiable, and reserve real
browser coverage for behavior that depends on browser storage, navigation, or offline capability.

Last updated: 2026-10-08

## Outstanding Browser Coverage

The 2026-10-08 pre-scaling full browser suite verified the mobile expense form's scroll boundary,
last split row, Save/Cancel toolbar, and absence of a second document/form scroller at 320px by
700px. The bounded form and Categories & Tags routes fix the body as well as clipping overflow.
Root-based mobile scaling was added afterward: its production build passes, but post-scaling
browser journeys and physical-device validation remain unverified. See [[layout-architecture]],
[[main-screen]] and [[product-roadmap]].

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
5. Run the focused suite, then `pnpm test` and `pnpm check`.

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

- its applicable success, boundary, invalid-input, and failure cases are covered
- tests are deterministic and isolated
- the focused suite and complete Vitest suite pass
- ESLint, Prettier, and TypeScript checks pass through `pnpm check`
- any durable behavior or strategy change is reconciled with the wiki

## Current Status

On 2026-10-08, before root scaling, `pnpm lint` and `pnpm build` passed, `pnpm test` passed
443 cases across 37 files, and the full `pnpm test:e2e` run passed 207 cases with 19
viewport-specific skips and no failures. This cleared current assertion drift, host-versus-browser
timezone assumptions, the expense/payment timeline's non-date sorting regression, desktop
Add-tag visibility, and mobile document-scroll leaks. Export copied feedback now resets from
selection change events, and its selection ref is synchronized outside render. Browser time
assertions run in the configured browser timezone rather than assuming the Node host timezone.
The 18 PWA production-build cases also passed before the scaling refactor.

After root scaling, the production build passed. The complete unit/browser/PWA suite has not been
rerun against that final typography/layout refactor; the earlier passing results are a baseline,
not proof of the new narrow-mobile UI. See [[layout-architecture]].

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
offline/cache paths separately. Test data lives in isolated browser contexts. Run `pnpm test:e2e`
(and `pnpm test:pwa` for production-build PWA checks) after installing Chromium with
`pnpm exec playwright install chromium`. Traces/results are written under their configured `/tmp`
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

Use `pnpm test` for a single complete run and `pnpm test:watch` while developing.

## Related

- [[balance-calculation]] — first implemented unit-test target
- [[onboarding-persistence]] — setup-step resume and monotonic-progress invariants
- [[money-representation-and-rounding]] — required accounting edge-case coverage
- [[product-roadmap]] — release-critical workflows and test requirements
