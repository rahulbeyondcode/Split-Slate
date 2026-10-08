---
name: product-roadmap
description: Living product direction and staged delivery roadmap for Split Slate
metadata:
  type: roadmap
---

# Product Direction and Roadmap

Purpose: provide a current planning compass without turning exploratory ideas into commitments.

Last updated: 2026-10-08

## How to Read This Page

This is a living roadmap, not a release contract or a second specification. Detailed architecture
and workflow pages remain canonical for their subjects, and implemented source remains
authoritative when it disagrees with any plan.

Roadmap terms have deliberate meanings:

- **Implemented** — observable in the current source and normal app flow
- **Approved** — agreed target behavior that is not necessarily implemented
- **Candidate** — useful direction that still needs prioritization or design
- **Decision required** — conflicting or incomplete designs must be resolved before implementation
- **Non-goal** — deliberately excluded from the stated horizon

The old “MVP / V2 / V3” labels are treated as historical grouping, not fixed version promises.
This page uses delivery horizons because prerequisites and product decisions matter more than a
version number.

## Product Compass

Split Slate is primarily a **clarity tool for shared expenses**. Personal tracking through solo
groups is supported, but it must not obscure the shared-expense identity. See
[[solo-group-support]].

The durable product principles are:

- **Shared expenses made simple:** a normal expense should be enterable in about five seconds once
  the group exists, and “who owes whom” should be understandable without manual arithmetic.
- **Local and private by default:** core data stays on the device. The current product has no
  account, backend, cloud expense history, or behavioral analytics dependency.
- **Core utility remains free:** adding expenses, using the approved split methods, calculating
  balances, working offline, and exporting owned data must not be artificially capped to force an
  upgrade.
- **Cloud is optional convenience:** future sync may be paid because it has recurring
  infrastructure costs, but it must not become a prerequisite for local expense sharing.
- **No mandatory traditional identity:** local use requires no email, phone number, or social
  login. A LocalUser and global device-local people directory provide local identity without an
  online account. See [[global-people-directory]].
- **The user owns the data:** portable, reconstructable exports and a usable recovery path are
  release requirements, not afterthoughts. See [[import-export]].
- **No payment processing:** Split Slate records expenses, balances, and repayments
  that happened elsewhere. It does not hold funds or become a bank or payment processor.
- **Complexity stays progressive:** common entry uses safe defaults; multiple payers, advanced
  splits, filtering, attachments, and other controls appear when requested.

Open-source distribution remains a product intention, not a current legal fact. The repository has
no license file, so a license and contribution policy must be chosen before claiming that a public
release is open source.

## Current Foundation

The following foundation is implemented now:

- React application shell with responsive dashboard and nested group routes
- Dexie/IndexedDB persistence hydrated into a single Zustand store
- Resumable first-run onboarding and standalone group creation
- One device-local user plus a reusable global people directory
- Solo and multi-member groups with one configured currency per group
- Group categories, group tags, and their current management guards
- Expense, split, transaction, tag, and attachment storage shapes
- Expense recording with five split types, one/multiple payers, optional tags, and local persistence
- Expense-list and group-overview surfaces showing saved records and balances
- Eight-field, group-local expense filtering with validated date and currency-aware amount bounds
- Selective versioned Link/typed-CSV/receipt-aware ZIP group transfer with validated editable import
  on fresh and existing devices
- Helpers for member/group totals, all-member balances, and suggested payments
- Expense detail, editing, and confirmed hard deletion with owned-attachment cleanup
- Group-only recording, correction, deletion, and portability of external payments with
  payment-aware balances; spending analytics remain expense-only

Expense creation/correction/removal, minor-unit accounting, split calculation, payer ranking, and
all-member balance suggestions are implemented. Member reference checks and directory self-deletion
protection complete the Horizon 1 implementation list. Attachment ingestion remains pending;
external payment recording is implemented. Current detail lives in [[index]], [[domain-models]], and
[[main-screen]].

## Next Tasks

### Validate Narrow-Mobile Root Scaling

The 2026-10-08 pre-scaling browser suite verified mobile expense-form scrolling, the final split
row, and Save/Cancel access. A subsequent rem refactor now scales the root from 16px at widths of
400px and above to a bounded 14px minimum on narrower viewports. Physical-device appearance,
post-scaling form/keyboard behavior, and regression coverage remain validation work; passing the
earlier baseline does not close these checks. See [[layout-architecture]], [[main-screen]] and
[[testing-strategy]].

### Browser-Suite Failures — pre-scaling baseline cleared 2026-10-08

The 2026-10-04 full Playwright run passed 118 tests, failed 30, and skipped 18 viewport-specific
cases. The 14 group-transfer failures looked for a questionnaire without opening the now-collapsed
**Export group** panel in Settings; the rest were assertion drift against current dates, balances,
dialogs, and scroll behavior. All were repaired as test/UI mismatches rather than product
regressions, and the 2026-10-05 full run passed 154 tests with no failures. Reopen this item only
for a new suite regression. See [[testing-strategy]].

The subsequent 2026-10-08 pre-scaling run passed 207 cases with no failures and 19 viewport-specific
skips after current assertion drift, timezone assumptions, timeline sorting, desktop Add-tag
visibility, and document-scroll leaks were repaired. The later root-scaling changes have a passing
build but have not yet been through the full browser suite or physical-device validation.

### Group Duplication

Add a same-device **Duplicate group** flow. It should reuse
the export questionnaire's content choices and dependency behavior: group information is required;
categories, tags, members, expenses, and available receipt attachments can be selected under the
same inclusion rules. Instead of generating a Link, CSV, or ZIP, the chosen content is cloned into
a separate local group. The source group remains unchanged. This is planned, not implemented;
identity handling, record-ID remapping, and other clone-write details need design during
implementation. See [[import-export]].

## Horizon 1 — Complete the Core Accounting Loop

**Goal:** a user can record, understand, correct, and remove shared expenses without leaving the
device.

The following Horizon 1 work is implemented:

1. Implement [[money-representation-and-rounding]] in currency input, calculation, validation, and
   formatting utilities.
2. Build pure split calculators for equal, amount, shares, percentage, and adjustment splits. See
   [[split-types]].
3. Expense create and update validation that enforces
   `sum(paid[].amount) == sum(owes[].amount)` using integer minor units.
4. Build the fast expense-entry flow with one or multiple payers, selected participants, category,
   optional tags, and an editable expense date. See [[paid-by]].
5. Expense detail, edit, and confirmed hard-delete behavior. See [[expense-edit-delete]].
6. All-member net balances and deterministic greedy transfer suggestions. The view labels them
   as suggestions that do not record payments. See
   [[balance-calculation]].
7. Member management with atomic duplicate-membership and referenced group/person existence
   checks, local-user member removal protection, and persisted directory self-deletion protection. See [[member-management]].

Five-second entry is an acceptance benchmark for the common case, not permission to skip
validation. Current defaults are the most recent recorded payer, equal split across all current
members, today's local date with the time left blank until entered or explicitly filled, and the
first active category. Remembered participants and other choices remain candidates; usability work
must establish the entry-time benchmark.

## Horizon 2 — Make the Local Product Safe to Release

**Goal:** local data survives ordinary use, remains portable, and works without a network after the
app is installed.

Approved or required work:

- The eight expense filters, stale-option cleanup, direct desktop/mobile filter coverage, and
  detail display are implemented. Mobile expense-form scrolling passed the pre-scaling browser
  suite; the subsequent narrow-mobile root scaling remains to be validated on devices.
- Finish category activation/deactivation controls; active-category expense-picker behavior is implemented.
- Implement receipt attachment ingestion, compression, and lazy loading; expense-deletion cascades are implemented.
- Continue hardening the implemented Link/CSV/ZIP editable snapshot transfer in [[import-export]].
  Selective export, integrity validation, fresh-ID atomic import, identity mapping, and
  receipt-aware ZIP round-trips are implemented. Merge and synchronization are deliberate non-goals.
- Whole-app local ZIP download and validated replace-only restore are implemented for fresh and
  existing devices, including receipts and app settings; see [[full-backup]]. Google Drive backup
  and synchronization remain outside this local scope.
- Add explicit backup/export reminders without making them spammy.
- Installable metadata, production service-worker app-shell caching, offline deep-link launch,
  separate resumable icon caching/repair, and a waiting-update prompt are implemented. Production
  desktop/mobile-emulated browser checks cover offline startup, icon repair, and the prompt UI;
  a true two-deployment update rehearsal, physical-device verification, and storage-pressure checks
  remain release gates.
  Updates do not force-reload an open session; users can postpone while finishing unsaved work.
  After all app windows close, the browser may activate a waiting worker before the next launch.
  A failed shell download must leave the older worker running. Icons are independently verified
  and replaced without resetting the shell or IndexedDB. See [[iconography]].
- Replace the active-development reset policy with versioned migrations before real user data is
  expected to survive application upgrades. See [[indexeddb-schema]].
- Add automated tests around accounting invariants, split rounding, cascades, import validation,
  migrations, and the most important user flows.
- Database bootstrap failures now show a reload/backup-restore path rather than waiting indefinitely.
  User-facing persistence failure handling on every write remains a release gate.

Snapshot transfer remains the local sharing model in this horizon. It is not synchronization: no
real-time updates, background merge, or automatic conflict resolution is promised.

## Horizon 3 — Local Insight and Convenience

**Goal:** make accumulated local data more useful without introducing a required server.

Candidates, ordered roughly by dependency and user value:

- Expand the implemented dashboard summaries, saved-action Activity view, Unsettled route, and
  category Analytics page; restore an Analytics entry point on narrow mobile screens. Current
  action snapshots do not reconstruct changes made before the activity table existed. See
  [[dashboard]].
- Add group and solo-group analytics by category, time, and date range.
- Add recurring-expense templates with an explicit choice between confirmation and automatic
  creation.
- Add restrained local reminders for recurring items, unsettled balances, and backups.
- Offline repayment recording is implemented per group; cross-group allocation and netting remain deferred.
- Design settlement-specific human sharing (Link/PDF/Excel) separately from reconstructable group
  transfer after the settlement data model is approved.
- Consider cross-group balances between the same global Person only after per-group balances are
  trustworthy.

### Offline Repayment Recording — Implemented

The user can record partial, full, or above-suggestion payments made outside Split Slate, scoped to
one group. Payment records adjust balances without rewriting expenses, have optional tags but no
category, and can be edited or deleted. Group transfer includes them when Expenses is selected;
whole-app backups preserve them. Cross-group allocation, netting, conversion, and sync remain
deferred. See [[settlement-recording]] and [[main-screen]].

Any future Link/PDF/Excel settlement output is a human-readable balance or repayment summary. It
must not be conflated with [[import-export]], whose purpose is reconstructing an editable group on a
different device.

## Horizon 4 — Optional Online Convenience

**Goal:** add multi-device collaboration without weakening the local product or requiring
traditional personal identity.

Everything in this horizon is a candidate requiring security, recovery, operational-cost, and
product-design work:

- Optional cloud group synchronization
- Optional Google Drive storage for whole-app backup files (separate from live synchronization)
- Manually shared, expiring invite links and device-bound membership
- Conflict handling for concurrent expense edits and deletions
- Device loss, replacement, and privacy-preserving recovery
- Group roles, administrative controls, and read-only access
- End-to-end encryption or an equivalently explicit server-visibility model
- Sync of groups, people/members, categories, tags, expenses, attachments, settlements, and
  relevant configuration

Cloud sync is the leading paid-capability candidate because it creates recurring infrastructure
costs. Exact pricing, entitlements, invite identity, cryptography, and recovery are not approved by
this roadmap. See [[monetization-model]] for dated research inputs rather than committed packaging.

## Exploration — Not Committed

These ideas stay visible without entering the delivery queue:

- Item-level expense entry and receipt OCR; see [[itemized-split]]
- Bank, SMS, merchant, or subscription automation
- True mixed-currency expenses, exchange rates, and cross-currency balances
- A broader subscription-tracking mode
- Payment-app launch shortcuts, while still processing no money inside Split Slate
- Native/TWA packaging, self-hosting, and regional-language experiences
- Optional rewarded-ad credits; see [[rewarded-ads]]

Receipt **attachments** are not in this list: storing user-supplied images is already an approved
local feature. OCR that interprets those images remains exploratory.

## Explicit Non-Goals for the Local Horizons

- Mandatory accounts, email addresses, phone numbers, or social login
- Server dependency for adding expenses, viewing history, or calculating balances
- Real-time collaboration or automatic merging disguised as file import
- In-app custody or transfer of money
- Forced ads, intrusive interstitials, expense caps, or cooldowns
- Mixed-currency accounting without a separately approved conversion model
- Treating speculative premium features as prerequisites for core splitting

## Superseded Parts of the Historical Scope

The historical master-scope document remains useful discovery material, but these claims must not
be reintroduced:

- The current product name is **Split Slate**, not “Split Splate.”
- People are reusable device-local records linked into groups, not unrelated copies per group.
- The approved design has five split methods, not only equal, exact amount, and percentage.
- Group creation instantiates selected default/custom categories; it does not blindly create a
  fixed global list.
- Unreferenced categories can be guard-deleted; the store models deactivation of referenced
  categories, but no management toggle exists yet. Tags have their own lifecycle.
- Onboarding currently finishes at the dashboard. Last-opened-group launch behavior is not an
  approved current feature.
- Portable transfer is no longer CSV-only or read-only; selective Link, CSV, and ZIP snapshots create
  new editable groups with fresh group-owned IDs.
- Offline application caching and install metadata are implemented; physical-device and
  multi-deployment release verification is still pending.

## Related

- [[index]] — navigation and current implementation-status summary
- [[domain-models]] — current entity shapes and enforced expense-creation invariants
- [[state-management]] — implemented persistence and mutation boundaries
- [[main-screen]] — current and target in-group experience
- [[import-export]] — approved local portability design
- [[market-opportunity]] — dated product research, not this roadmap
- [[monetization-model]] — dated packaging research, not approved pricing
