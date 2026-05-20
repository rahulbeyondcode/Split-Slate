# split-slate Wiki

Synthesized knowledge for the split-slate expense splitting PWA.
This wiki is the sole source of truth. Source: `src/` | Changes: [log.md](log.md)

---

## Navigation

### Architecture
- [Domain Models](architecture/domain-models.md) — Group, Member, Expense, Category, LocalUser shapes and invariants
- [Balance Calculation](architecture/balance-calculation.md) — net = totalPaid − totalOwed; worked example; debt simplification
- [State Management](architecture/state-management.md) — Zustand store shape; what is persisted vs computed
- [Split Types](architecture/split-types.md) — 5 split types (equal, amount, shares, percentage, adjustment); mechanics, UX, validation, splitMeta storage

### Decisions
- [Group-Scoped Members](decisions/group-scoped-members.md) — why no global user in MVP/V2; privacy-first tradeoff
- [Expense Model Design](decisions/expense-model-design.md) — why both paid[] and owes[] are stored on each expense
- [Solo Group Support](decisions/solo-group-support.md) — single-member groups are valid; add-members step is skippable with an explanatory prompt
- [Import / Export Design](decisions/import-export.md) — three export formats (link/CSV/ZIP), two import modes (view-only/editable), conflict resolution strategy
- [Expense Edit and Delete](decisions/expense-edit-delete.md) — hard delete with attachment cascade; no access control in MVP; V3 note on admin controls
- [Group Deletion](decisions/group-deletion.md) — permanent, cascades all group data (members, expenses, categories, attachments); irreversible warning shown

### Systems
- [IndexedDB Schema](systems/indexeddb-schema.md) — tables, primary keys, indexes, access patterns (includes attachments table)

### Workflows
- [Onboarding](workflows/onboarding.md) — first-launch flow; standard path and import-based entry points
- [Main Screen](workflows/main-screen.md) — groups list home, in-group tabs, expense list structure
- [Paid-By](workflows/paid-by.md) — frequent payers quick-select, pre-selection logic, multi-payer mode
- [Member Management](workflows/member-management.md) — add anytime, edit name/icon freely, removal blocked if member is in any expense
- [Category Management](workflows/category-management.md) — app master list + group-level selection at creation (skippable); custom categories addable anytime; rename/deactivate only, never delete
- [Filtering](workflows/filtering.md) — expense list filtering across 7 fields (name, date, category, paid-by, member, split type, amount); all ANDed, not persisted

### Ideas (captured, not committed)
- [Rewarded Ads](ideas/rewarded-ads.md) — optional ad-watch → credits → Pro unlock mechanic; fully opt-in
- [Itemized Split](ideas/itemized-split.md) — 6th split type; bottom-up item-by-item receipt assignment; deferred to V2/V3

### Research
- [Competitive Landscape](research/competitive-landscape.md) — 7 apps analysed, fatal flaws, table-stakes features, feature monopolies
- [Market Opportunity](research/market-opportunity.md) — Splitwise paywall gap, target positioning, differentiators, GTM summary
- [User Pain Points](research/user-pain-points.md) — top complaints, 12 most-requested features, India-specific pain points
- [Monetization Model](research/monetization-model.md) — pricing tiers (India + global), what stays free, what NOT to do

---

## Implementation Status

| Area                              | Status      |
|-----------------------------------|-------------|
| Project scaffold                  | DONE        |
| Routing skeleton                  | DONE        |
| IndexedDB layer + Zustand store   | PENDING     |
| Onboarding flow (7 steps)         | PENDING     |
| Groups list (home screen)         | PENDING     |
| Group creation flow               | PENDING     |
| Member management                 | PENDING     |
| Category management               | PENDING     |
| Add / edit / delete expense       | PENDING     |
| Split types (5 types)             | PENDING     |
| Paid-by (frequent payers UI)      | PENDING     |
| Expense list + filtering          | PENDING     |
| Balances tab                      | PENDING     |
| Export (Link / CSV / ZIP)         | PENDING     |
| Import (view-only + as your group)| PENDING     |

---

## Key Invariants (Quick Reference)

1. `sum(paid[].amount) == sum(owes[].amount)` on every expense
2. Member IDs are group-scoped — same person in two groups = two different UUIDs
3. Balance = totalPaid − totalOwed (per member, per group) — not a running ledger
4. Categories can only be renamed or deactivated, never deleted
5. No global user in MVP/V2 — only a device-local `localUser`
6. Group creator (LocalUser) is automatically added as a Member when the group is created — they are always part of every group they create and cannot be added again manually
7. `categoryId` is mandatory on every expense — no uncategorised expenses
8. Currency is single per group (set at creation, defaults to INR) — no multi-currency in MVP
