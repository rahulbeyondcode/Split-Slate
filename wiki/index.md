# split-slate Wiki

Synthesized knowledge for the split-slate expense splitting PWA.
This wiki is the sole persistent compiled knowledge layer. The implementation in `src/` remains
authoritative; `app-featureset-context/spec-sheet.md` is a historical baseline where later source
and approved decisions have superseded it. Changes: [log.md](log.md)

Last updated: 2026-08-20

---

## Navigation

### Roadmap
- [Product Direction and Roadmap](roadmap/product-roadmap.md) — living product compass, delivery horizons, release gates, non-goals, and explicitly uncommitted ideas

### Architecture
- [Domain Models](architecture/domain-models.md) — Group, Member, Expense, Category, LocalUser shapes and invariants
- [Balance Calculation](architecture/balance-calculation.md) — implemented member-net/group-total helpers; planned all-member balances and debt simplification
- [State Management](architecture/state-management.md) — Dexie-first persistence with one hydrated Zustand store; exact validation and atomicity boundaries
- [Split Types](architecture/split-types.md) — 5 approved and modelled split types; entry/calculation implementation is pending and deterministic rounding is now designed
- [Layout Architecture](architecture/layout-architecture.md) — current mobile/tablet/desktop shell, route stubs, sidebar, footer, and activity panel

### Decisions
- [Global People Directory](decisions/global-people-directory.md) — device-local friends list; members link to shared people; supersedes per-group members
- [Expense Model Design](decisions/expense-model-design.md) — why both paid[] and owes[] are stored on each expense
- [Solo Group Support](decisions/solo-group-support.md) — single-member groups are valid; add-members can finish without adding anyone, while explicit solo-helper copy remains pending
- [Onboarding Persistence](decisions/onboarding-persistence.md) — per-step save to IndexedDB + resume from a monotonic `lastCompletedStep`; completion gated by an explicit flag, not `localUser` presence
- [Import / Export Design](decisions/import-export.md) — approved but unimplemented design for three export formats, two import modes, and conflict resolution
- [Expense Edit and Delete](decisions/expense-edit-delete.md) — approved but unimplemented hard-delete and attachment-cascade behavior
- [Group Deletion](decisions/group-deletion.md) — approved pending design for permanent deletion with a full related-data cascade and irreversible warning
- [Money Representation and Rounding](decisions/money-representation-and-rounding.md) — approved integer minor-unit storage and deterministic largest-remainder allocation; implementation pending

### Systems
- [IndexedDB Schema](systems/indexeddb-schema.md) — current tables and indexes, including tags; active development resets the database after schema changes instead of migrating it

### Workflows
- [Onboarding](workflows/onboarding.md) — implemented first-launch flow ending at `/dashboard`; import-based bypasses are planned
- [Group Creation](workflows/group-creation.md) — standalone 4-step flow; writes begin only on final submission and then run sequentially
- [Main Screen](workflows/main-screen.md) — current dashboard and nested group-detail routes; planned expense entry and balance views
- [Paid-By](workflows/paid-by.md) — planned frequent-payer selector, ranking updates, pre-selection, and multi-payer entry; storage shapes exist
- [People Directory](workflows/people-directory.md) — global friends list; manage people; pick them when building a group
- [Member Management](workflows/member-management.md) — expense-reference removal guards exist; duplicate, self, and creator protections plus management UX remain incomplete
- [Category Management](workflows/category-management.md) — implemented group category CRUD and delete guards; deactivation and expense-picker integration remain future work
- [Tag Management](workflows/tag-management.md) — named and colored group-scoped tags; preset/custom hex picker; optional expense references; atomic cascade deletion
- [Filtering](workflows/filtering.md) — planned eight-field expense filtering; the current route only renders a read-only list sorted by expense date
- [Dashboard](workflows/dashboard.md) — current groups-list implementation and the planned summaries, analytics, and activity views

### Ideas (captured, not committed)
- [Rewarded Ads](ideas/rewarded-ads.md) — optional ad-watch → credits → Pro unlock mechanic; fully opt-in
- [Itemized Split](ideas/itemized-split.md) — 6th split type; bottom-up item-by-item receipt assignment; deferred to V2/V3
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
| Member management                  | PENDING     |
| Category management                | IN PROGRESS |
| Tag management                     | IN PROGRESS |
| Add / edit / delete expense        | PENDING     |
| Split types (5 types)              | PENDING     |
| Paid-by (frequent payers UI)       | PENDING     |
| Expense list + filtering           | IN PROGRESS |
| Balances / who-owes-whom view      | PENDING     |
| Receipt attachments                | PENDING     |
| Group settings + deletion          | PENDING     |
| Export (Link / CSV / ZIP)          | PENDING     |
| Import (view-only + as your group) | PENDING     |
| Installable/offline PWA support    | PENDING     |
| Automated tests                    | PENDING     |

The IndexedDB layer and Zustand store are complete for the current development scope. Schema
changes intentionally require resetting the local database; versioned migrations are not needed
while development data is disposable. All group-detail destinations have routes, but several are
lightweight or partial. Dashboard-level footer items for Activity, Unsettled, Analytics, and
Settings remain unmatched; see [[layout-architecture]].

---

## Key Invariants (Quick Reference)

1. Target expense invariant: `sum(paid[].amount) == sum(owes[].amount)`; enforcement begins with the planned expense mutation and validation flow
2. People are global (one device-local directory); a group member is a link to a person, so the same person in two groups is one Person referenced twice
3. Balance = totalPaid − totalOwed (per member, per group) — not a running ledger
4. Categories can be renamed and guard-deleted now; the model supports deactivation, but its UI and expense-picker behavior are planned
5. No global user in MVP/V2 — only a device-local `localUser`
6. Group creation automatically adds the LocalUser as a Member linked to their self Person; current UI avoids duplicates, but the member store does not yet enforce uniqueness or creator retention
7. `categoryId` is mandatory on every expense — no uncategorised expenses
8. Currency is single per group (set at creation, defaults to INR) — no multi-currency in MVP
9. Tags are named and colored group-scoped records referenced optionally through `Expense.tagIds`; deleting a tag atomically removes its references without deleting expenses
10. A group must have at least one category — enforced at creation (categories step requires ≥1 selected) so every expense can be categorised
11. Approved monetary target: stored money uses currency-aware integer minor units and calculated splits use deterministic largest-remainder allocation; no expense write path enforces this yet
