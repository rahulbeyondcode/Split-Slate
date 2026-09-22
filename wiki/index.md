# split-slate Wiki

Synthesized knowledge for the split-slate expense splitting PWA.
This wiki is the sole persistent compiled knowledge layer. The implementation in `src/` remains
authoritative; `app-featureset-context/spec-sheet.md` is a historical baseline where later source
and approved decisions have superseded it. Changes: [log.md](log.md)

Last updated: 2026-09-23

---

## Navigation

### Roadmap
- [Product Direction and Roadmap](roadmap/product-roadmap.md) — living product compass, delivery horizons, release gates, non-goals, and explicitly uncommitted ideas

### Architecture
- [Domain Models](architecture/domain-models.md) — current entity shapes and invariants, with pending tag-display and attachment behavior distinguished
- [Balance Calculation](architecture/balance-calculation.md) — exact member/group totals, all-member balances, and deterministic suggested transfers
- [State Management](architecture/state-management.md) — shared and feature-local slices in one hydrated store; persisted tag cleanup, aggregate limits, and remaining cascade boundaries
- [Split Types](architecture/split-types.md) — 5 implemented split types with exact validation and deterministic rounding; numeric percentage-total display remains pending
- [Layout Architecture](architecture/layout-architecture.md) — current responsive shell and navigation stubs; theme controls remain planned

### Decisions
- [Global People Directory](decisions/global-people-directory.md) — device-local friends list; members link to shared people; supersedes per-group members
- [Expense Model Design](decisions/expense-model-design.md) — creation and editing store paid/owed allocations and split metadata; detail and deletion are implemented
- [Solo Group Support](decisions/solo-group-support.md) — single-member creation and zero-net overview/balances are implemented; onboarding solo-helper copy remains pending
- [Onboarding Persistence](decisions/onboarding-persistence.md) — per-step save to IndexedDB + resume from a monotonic `lastCompletedStep`; completion gated by an explicit flag, not `localUser` presence
- [Import / Export Design](decisions/import-export.md) — approved but unimplemented design for three export formats, two import modes, and conflict resolution
- [Expense Edit and Delete](decisions/expense-edit-delete.md) — implemented editing/deletion and atomic receipt cascades; tag resurrection resolved, shares-precision limitation remains
- [Group Deletion](decisions/group-deletion.md) — approved pending design for permanent deletion with a full related-data cascade and irreversible warning
- [Money Representation and Rounding](decisions/money-representation-and-rounding.md) — minor-unit parsing/storage/formatting, deterministic largest-remainder allocation, and safe group-spending limits
- [String Input Normalization](decisions/string-input-normalization.md) — required strings reject trimmed blanks; optional expense inputs have explicit blank-value semantics
- [Testing Strategy](decisions/testing-strategy.md) — Vitest and Playwright suites, tag-cleanup concurrency/rollback regressions, test-only fake IndexedDB, and remaining gaps

### Systems
- [IndexedDB Schema](systems/indexeddb-schema.md) — current tables, expense-write validation, and active-category behavior; development schema changes require a database reset

### Workflows
- [Development Tools](workflows/development-tools.md) — typed realistic presets, individual creation buttons, collision-free naming, and sequential persistence boundaries
- [Onboarding](workflows/onboarding.md) — implemented first-launch flow and membership guards, ending at `/dashboard`; import-based bypasses are planned
- [Group Creation](workflows/group-creation.md) — standalone 4-step flow; writes begin only on final submission and then run sequentially
- [Main Screen](workflows/main-screen.md) — implemented expense create/detail/edit/delete, group-switch state reset, and balance views
- [Paid-By](workflows/paid-by.md) — implemented frequent-payer selection, atomic ranking updates, recent-payer defaults, and multi-payer entry
- [People Directory](workflows/people-directory.md) — global friends list; manage people; pick them when building a group
- [Member Management](workflows/member-management.md) — add/edit/confirmed removal, atomic reference/duplicate guards, and local-user protection; remaining cascade limits are documented
- [Category Management](workflows/category-management.md) — implemented group category CRUD, delete guards, and active-category expense picker; deactivation UI remains pending
- [Tag Management](workflows/tag-management.md) — group tags, selection, and detail display; transactional persisted-reference cleanup and group expense refresh; list/overview display remains pending
- [Filtering](workflows/filtering.md) — planned eight-field filtering; the current date-sorted list links to expense detail/edit/delete
- [Dashboard](workflows/dashboard.md) — current groups-list implementation and the planned summaries, analytics, and activity views

### Ideas (captured, not committed)
- [Rewarded Ads](ideas/rewarded-ads.md) — optional ad-watch → credits → Pro unlock mechanic; fully opt-in
- [Itemized Split](ideas/itemized-split.md) — exploratory sixth split type for receipt-item assignment, with no committed delivery version
- [Category Settings UI](ideas/category-settings-ui.md) — data layer built (DB-backed master/default category lists); settings screen still TODO

### Research
- [Competitive Landscape](research/competitive-landscape.md) — dated May 2026 research snapshot covering 9 apps, with current fact corrections
- [Market Opportunity](research/market-opportunity.md) — dated research thesis and recommendations, not the committed product roadmap
- [User Pain Points](research/user-pain-points.md) — dated complaint synthesis with current-behavior qualifications
- [Monetization Model](research/monetization-model.md) — unimplemented pricing and packaging proposal derived from the research snapshot

---

## Implementation Status

| Area                               | Status      |
|------------------------------------|-------------|
| Project scaffold                   | DONE        |
| Routing and responsive app shell   | IN PROGRESS |
| IndexedDB layer + Zustand store    | DONE        |
| Onboarding flow (5 steps)          | DONE        |
| Dashboard / groups list (home)     | IN PROGRESS |
| Group detail routes                | DONE        |
| Group overview                     | DONE        |
| Group creation flow                | DONE        |
| People directory (friends list)    | DONE        |
| Member management                  | DONE        |
| Category management                | IN PROGRESS |
| Tag management                     | IN PROGRESS |
| Add expense                       | DONE        |
| Edit / delete expense             | DONE        |
| Split types (5 types)              | DONE        |
| Paid-by (frequent payers UI)       | DONE        |
| Expense list + filtering           | IN PROGRESS |
| Balances / who-owes-whom view      | DONE        |
| Receipt attachments                | PENDING     |
| Group settings + deletion          | PENDING     |
| Export (Link / CSV / ZIP)          | PENDING     |
| Import (view-only + as your group) | PENDING     |
| Installable/offline PWA support    | PENDING     |
| Automated tests                    | IN PROGRESS |

The IndexedDB layer and Zustand store are complete for the current development scope. Schema
changes intentionally require resetting the local database; versioned migrations are not needed
while development data is disposable. All group-detail destinations have routes, but several are
lightweight or partial. Dashboard-level footer items for Activity, Unsettled, Analytics, and
Settings remain unmatched; see [[layout-architecture]].

Tag cleanup now uses persisted references inside its transaction, resolving the review finding
that stale cleanup could recreate deleted expenses or overwrite newer edits. One review finding
remains: a shares value accepted at the supported maximum cannot be saved after reopening for
editing. See [[tag-management]] and [[expense-edit-delete]] for current guarantees and limitations.

---

## Key Invariants (Quick Reference)

1. Expense creation and editing enforce `sum(paid[].amount) == sum(owes[].amount)` with positive totals and safe-integer minor-unit amounts
2. People are global (one device-local directory); a group member is a link to a person, so the same person in two groups is one Person referenced twice
3. Balance = totalPaid − totalOwed (per member, per group) — not a running ledger
4. Categories can be renamed and guard-deleted now; new expenses omit inactive categories, while an edit may retain its current inactive category; the management toggle is planned
5. No global user in MVP/V2 — only a device-local `localUser`
6. Group creation automatically adds the LocalUser as a Member linked to their self Person; the picker excludes existing members, `addMember` atomically verifies referenced group/person existence and rejects duplicate links; `removeMember` blocks removing the local user, and `removePerson` checks persisted identity to block directory-wide self deletion
7. `categoryId` is mandatory on every expense — no uncategorised expenses
8. Currency is single per group (set at creation, defaults to INR) — no multi-currency in MVP
9. Tags are named and colored group-scoped records referenced optionally through `Expense.tagIds`; deletion reads persisted group expenses and updates only their tag references in one transaction, then refreshes that group's expense state without recreating deleted expenses
10. A group must have at least one category — enforced at creation (categories step requires ≥1 selected) so every expense can be categorised
11. Expense creation and editing parse and store currency-aware integer minor units; split calculations use deterministic largest-remainder allocation, and all amount displays convert from minor units
12. Expense creation and editing reject saves that would push total group spending above `Number.MAX_SAFE_INTEGER` minor units; the check uses BigInt within the expense transaction to protect derived balances and displays, with updates replacing the old expense amount
