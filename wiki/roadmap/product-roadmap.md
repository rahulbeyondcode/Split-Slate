---
name: product-roadmap
description: Living product direction and staged delivery roadmap for Split Slate
metadata:
  type: roadmap
---

# Product Direction and Roadmap

Purpose: provide a current planning compass without turning exploratory ideas into commitments.

Last updated: 2026-08-20

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
- **No payment processing:** Split Slate records expenses, balances, and eventually repayments that
  happened elsewhere. It does not hold funds or become a bank or payment processor.
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
- Read-only expense-list and group-overview surfaces
- Helpers for one-member net balance and total group spending

The data shapes for expenses are ahead of the product flow: there is no normal expense create,
edit, delete, split calculation, attachment ingest, or settlement mutation yet. Existing expense
screens therefore demonstrate reads, not a complete accounting loop. Current detail lives in
[[index]], [[domain-models]], and [[main-screen]].

## Horizon 1 — Complete the Core Accounting Loop

**Goal:** a user can record, understand, correct, and remove shared expenses without leaving the
device.

Approved work, in dependency order:

1. Implement [[money-representation-and-rounding]] in currency input, calculation, validation, and
   formatting utilities.
2. Build pure split calculators for equal, amount, shares, percentage, and adjustment splits. See
   [[split-types]].
3. Build expense create and update validation that enforces
   `sum(paid[].amount) == sum(owes[].amount)` using integer minor units.
4. Build the fast expense-entry flow with one or multiple payers, selected participants, category,
   optional tags, and an editable expense date. See [[paid-by]].
5. Complete expense detail, edit, and hard-delete behavior. See [[expense-edit-delete]].
6. Calculate all-member net balances and render clear suggested transfers. The simplification
   method must be described as a settlement suggestion, not hidden financial history. See
   [[balance-calculation]].
7. Complete member-management UI and enforce duplicate membership, self, creator-retention, and
   referenced-record rules at the store boundary. See [[member-management]].

Five-second entry is an acceptance benchmark for the common case, not permission to skip
validation. Candidate defaults include the most recent payer, equal split, recent participants,
current time, and remembered safe choices; usability work must confirm which defaults genuinely
reduce effort.

## Horizon 2 — Make the Local Product Safe to Release

**Goal:** local data survives ordinary use, remains portable, and works without a network after the
app is installed.

Approved or required work:

- Complete expense history, detail display, and the planned filters in [[filtering]].
- Finish category activation/deactivation and active-category expense-picker behavior.
- Implement receipt attachment ingestion, compression, lazy loading, and delete cascades.
- Implement the Link/CSV/ZIP export and the view-only/editable import flows in
  [[import-export]].
- Add explicit backup/export reminders without making them spammy.
- Add installable PWA metadata, service-worker caching, offline-start verification, and an
  update/recovery experience. IndexedDB alone does not make the application an offline PWA.
- Replace the active-development reset policy with versioned migrations before real user data is
  expected to survive application upgrades. See [[indexeddb-schema]].
- Add automated tests around accounting invariants, split rounding, cascades, import validation,
  migrations, and the most important user flows.
- Add visible bootstrap and persistence failure states so the app cannot wait indefinitely after a
  database failure.

Snapshot transfer remains the local sharing model in this horizon. It is not synchronization: no
real-time updates, background merge, or automatic conflict resolution is promised.

## Horizon 3 — Local Insight and Convenience

**Goal:** make accumulated local data more useful without introducing a required server.

Candidates, ordered roughly by dependency and user value:

- Finish dashboard summaries, cross-group activity, unsettled views, and category analytics. See
  [[dashboard]].
- Add group and solo-group analytics by category, time, and date range.
- Add recurring-expense templates with an explicit choice between confirmation and automatic
  creation.
- Add restrained local reminders for recurring items, unsettled balances, and backups.
- Add settlement recording after the settlement model decision below is resolved.
- Consider cross-group balances between the same global Person only after per-group balances are
  trustworthy.

### Settlement Decision Gate

The current target in [[main-screen]] describes a V2 binary fully-settled toggle, while the older
scope proposed explicit repayment records such as “Rahul paid Alex ₹500.” These are not equivalent.
A toggle is simpler but loses amount and audit history; a transfer record supports partial
repayment and future sync but adds a new entity and workflow.

This roadmap does not silently choose between them. Before settlement work starts, approve a
separate decision covering the data model, full versus partial repayment, editing/deletion,
interaction with suggested transfers, and import/export behavior. A dedicated Settlements tab is
not required merely because settlement records exist.

## Horizon 4 — Optional Online Convenience

**Goal:** add multi-device collaboration without weakening the local product or requiring
traditional personal identity.

Everything in this horizon is a candidate requiring security, recovery, operational-cost, and
product-design work:

- Optional cloud group synchronization
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
- Unreferenced categories can be guard-deleted; referenced ones can be deactivated, and tags have
  their own lifecycle.
- Onboarding currently finishes at the dashboard. Last-opened-group launch behavior is not an
  approved current feature.
- Portable sharing is no longer described as CSV-only; Link and ZIP modes are also approved.
- PWA installation and offline application caching are pending, even though entity data already
  lives in IndexedDB.

## Related

- [[index]] — navigation and current implementation-status summary
- [[domain-models]] — current entity shapes and target expense invariant
- [[state-management]] — implemented persistence and mutation boundaries
- [[main-screen]] — current and target in-group experience
- [[import-export]] — approved local portability design
- [[market-opportunity]] — dated product research, not this roadmap
- [[monetization-model]] — dated packaging research, not approved pricing

