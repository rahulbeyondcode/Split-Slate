---
name: testing-strategy
description: Test architecture, authoring protocol, and layer boundaries for Split Slate
metadata:
  type: decisions
---

# Decision: Testing Strategy

Purpose: keep accounting tests fast, make every implemented area verifiable, and reserve real
browser coverage for behavior that depends on browser storage, navigation, or offline capability.

Last updated: 2026-09-19

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
Playwright journeys use `.e2e.ts` under `src/features/expenses/tests/browser/`, as configured in
`playwright.config.ts`. Cross-directory imports continue to use the `@/` alias.

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

Vitest covers the existing helpers and schemas plus money conversion, currency formatting, all five
split methods, expense input validation, and payer defaults/ranking. Expense-store integration tests
use `fake-indexeddb` and assert persisted state, hydration, concurrent writes, stale-reference
rejection, and rollback when either write fails.

`fake-indexeddb` is a development dependency imported by the expense-store tests. It supplies an
in-memory IndexedDB implementation in Node so the real Dexie/store code can exercise persistence
and rollback. The application uses browser IndexedDB; Playwright also uses real browser storage.

Playwright expense suites are configured for Chromium at desktop and mobile sizes. They cover
form recording, all five split methods, multiple payers, list/balance updates, reload persistence,
cancellation, and retry after save rejection. Test data lives in isolated browser contexts. Run `pnpm test:e2e` after
`pnpm exec playwright install chromium`. Traces/results are written under `/tmp/split-slate-playwright`.
Other feature/component/browser coverage remains pending.

This is an inventory of existing suites, not evidence of a passing run. Direct coverage for the
new membership transaction/repeated-add guard and aggregate group-spending limit remains pending;
the existing concurrent-write case covers expense saves, not member additions.

Use `pnpm test` for a single complete run and `pnpm test:watch` while developing.

## Related

- [[balance-calculation]] — first implemented unit-test target
- [[onboarding-persistence]] — setup-step resume and monotonic-progress invariants
- [[money-representation-and-rounding]] — required accounting edge-case coverage
- [[product-roadmap]] — release-critical workflows and test requirements
