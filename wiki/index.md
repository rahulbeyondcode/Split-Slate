# split-slate Wiki

Synthesized knowledge for the split-slate expense splitting PWA.
This wiki is the sole source of truth. Source: `src/` | Changes: [log.md](log.md)

Last updated: 2026-08-16

---

## Navigation

### Architecture
- [Domain Models](architecture/domain-models.md) — Group, Member, Expense, Category, LocalUser shapes and invariants
- [Balance Calculation](architecture/balance-calculation.md) — current inline group-total calculation; member-net formula and planned debt simplification
- [State Management](architecture/state-management.md) — Dexie-first persistence with one hydrated Zustand store composed from domain slices, including group tags
- [Split Types](architecture/split-types.md) — 5 split types (equal, amount, shares, percentage, adjustment); mechanics, UX, validation, splitMeta storage
- [Layout Architecture](architecture/layout-architecture.md) — current mobile/tablet/desktop shell, route stubs, sidebar, footer, and activity panel

### Decisions
- [Global People Directory](decisions/global-people-directory.md) — device-local friends list; members link to shared people; supersedes per-group members
- [Expense Model Design](decisions/expense-model-design.md) — why both paid[] and owes[] are stored on each expense
- [Solo Group Support](decisions/solo-group-support.md) — single-member groups are valid; add-members step is skippable with an explanatory prompt
- [Onboarding Persistence](decisions/onboarding-persistence.md) — per-step save to IndexedDB + resume from a monotonic `lastCompletedStep`; completion gated by an explicit flag, not `localUser` presence
- [Import / Export Design](decisions/import-export.md) — three export formats (link/CSV/ZIP), two import modes (view-only/editable), conflict resolution strategy
- [Expense Edit and Delete](decisions/expense-edit-delete.md) — hard delete with attachment cascade; no access control in MVP; V3 note on admin controls
- [Group Deletion](decisions/group-deletion.md) — approved pending design for permanent deletion with a full related-data cascade and irreversible warning

### Systems
- [IndexedDB Schema](systems/indexeddb-schema.md) — current tables and indexes, including tags, plus the unresolved version-1 migration risk

### Workflows
- [Onboarding](workflows/onboarding.md) — first-launch flow; standard path and import-based entry points
- [Group Creation](workflows/group-creation.md) — standalone post-onboarding flow; 4 steps, create-on-finish; shares step components with onboarding
- [Main Screen](workflows/main-screen.md) — current dashboard and nested group-detail routes; planned expense entry and balance views
- [Paid-By](workflows/paid-by.md) — frequent payers quick-select, pre-selection logic, multi-payer mode
- [People Directory](workflows/people-directory.md) — global friends list; manage people; pick them when building a group
- [Member Management](workflows/member-management.md) — members link to people; two removal scopes (per-group vs directory-wide)
- [Category Management](workflows/category-management.md) — DB-backed master list + group-level selection at creation (≥1 mandatory, defaults pre-selected); custom categories addable anytime; guarded and confirmed delete
- [Tag Management](workflows/tag-management.md) — named and colored group-scoped tags; preset/custom hex picker; optional expense references; atomic cascade deletion
- [Filtering](workflows/filtering.md) — expense list filtering across 8 fields (name, date, category, tags, paid-by, member, split type, amount); all ANDed, not persisted
- [Dashboard](workflows/dashboard.md) — current groups-list implementation and the planned summaries, analytics, and activity views

### Ideas (captured, not committed)
- [Rewarded Ads](ideas/rewarded-ads.md) — optional ad-watch → credits → Pro unlock mechanic; fully opt-in
- [Itemized Split](ideas/itemized-split.md) — 6th split type; bottom-up item-by-item receipt assignment; deferred to V2/V3
- [Category Settings UI](ideas/category-settings-ui.md) — data layer built (DB-backed master/default category lists); settings screen still TODO

### Research
- [Competitive Landscape](research/competitive-landscape.md) — 7 apps analysed, fatal flaws, table-stakes features, feature monopolies
- [Market Opportunity](research/market-opportunity.md) — Splitwise paywall gap, target positioning, differentiators, GTM summary
- [User Pain Points](research/user-pain-points.md) — top complaints, 12 most-requested features, India-specific pain points
- [Monetization Model](research/monetization-model.md) — pricing tiers (India + global), what stays free, what NOT to do

---

## Implementation Status

| Area                               | Status      |
|------------------------------------|-------------|
| Project scaffold                   | DONE        |
| Routing and responsive app shell   | IN PROGRESS |
| IndexedDB layer + Zustand store    | IN PROGRESS |
| Onboarding flow (5 steps)          | DONE        |
| Dashboard / groups list (home)     | IN PROGRESS |
| Group detail routes                | DONE        |
| Group overview                     | IN PROGRESS |
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

`IndexedDB layer + Zustand store` remains in progress because the current schema works for a
fresh database but has no versioned migration path for databases created by older builds. See
[[indexeddb-schema]]. All group-detail destinations have routes, but several are lightweight or
partial. Dashboard-level footer items for Activity, Unsettled, Analytics, and Settings remain
unmatched; see [[layout-architecture]].

---

## Key Invariants (Quick Reference)

1. `sum(paid[].amount) == sum(owes[].amount)` on every expense
2. People are global (one device-local directory); a group member is a link to a person, so the same person in two groups is one Person referenced twice
3. Balance = totalPaid − totalOwed (per member, per group) — not a running ledger
4. Categories can be renamed or deactivated anytime; deletable only when no expense references them and the group has another category left
5. No global user in MVP/V2 — only a device-local `localUser`
6. Group creator (LocalUser) is automatically added as a Member (linked to their self Person) when the group is created — they are always part of every group they create and cannot be added again manually
7. `categoryId` is mandatory on every expense — no uncategorised expenses
8. Currency is single per group (set at creation, defaults to INR) — no multi-currency in MVP
9. Tags are named and colored group-scoped records referenced optionally through `Expense.tagIds`; deleting a tag atomically removes its references without deleting expenses
10. A group must have at least one category — enforced at creation (categories step requires ≥1 selected) so every expense can be categorised
