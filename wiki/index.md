# split-slate Wiki

Synthesized knowledge for the split-slate expense splitting PWA.
This wiki is the sole persistent compiled knowledge layer. The implementation in `src/` remains
authoritative; `app-featureset-context/spec-sheet.md` is a historical baseline where later source
and approved decisions have superseded it. Changes: [log.md](log.md)

Last updated: 2026-10-04

---

## Navigation

### Roadmap
- [Product Direction and Roadmap](roadmap/product-roadmap.md) — browser-suite repair, group duplication, PWA release gates, and delivery horizons

### Architecture
- [Domain Models](architecture/domain-models.md) — current entity shapes, saved PNG icon keys, fixed-hundredths money, currency relabeling, and pending tag-display/attachment behavior
- [Balance Calculation](architecture/balance-calculation.md) — fixed-hundredths member/group totals, all-member balances, and deterministic suggested transfers
- [State Management](architecture/state-management.md) — hydrated Zustand slices plus persisted mutation boundaries, including all-or-nothing fresh-ID group import
- [Split Types](architecture/split-types.md) — 5 split types with fixed-hundredths monetary allocations and exact ratios; numeric percentage-total display remains pending
- [Layout Architecture](architecture/layout-architecture.md) — responsive shell, mobile expense and category/tag scrolling with fixed card headers, bounded desktop lists/cards, and route resets

### Decisions
- [Global People Directory](decisions/global-people-directory.md) — device-local friends list; members link to shared people; supersedes per-group members
- [Expense Model Design](decisions/expense-model-design.md) — fixed-hundredths paid/owed allocations and exact decimal ratio metadata, with numeric legacy read compatibility
- [Solo Group Support](decisions/solo-group-support.md) — single-member creation and zero-net overview/balances are implemented; onboarding solo-helper copy remains pending
- [Onboarding Persistence](decisions/onboarding-persistence.md) — resumable per-step standard setup plus atomic import-specific completion for fresh devices
- [Import / Export Design](decisions/import-export.md) — selective Link/CSV/ZIP group transfer and atomic import; planned same-device duplication reuses selection without file generation
- [Whole-App Backup and Restore](decisions/full-backup.md) — versioned ZIP, expected download name and wrong-file navigation, confirmed replace-only recovery; Drive deferred
- [Expense Edit and Delete](decisions/expense-edit-delete.md) — full editor, confirmed deletion, and immediate reference-only category/tag changes without rebuilding splits
- [Group Deletion](decisions/group-deletion.md) — implemented permanent group-owned data cascade with confirmation; shared contacts remain
- [Money Representation and Rounding](decisions/money-representation-and-rounding.md) — implemented fixed hundredths for every currency, exact allocation, and confirmed no-conversion relabeling
- [Iconography](decisions/iconography.md) — shared featured-or-gallery PNG picker, offline caching and repair, Lucide controls, error illustrations, and onboarding artwork
- [Confirmation Dialogs](decisions/confirmation-dialogs.md) — shared in-app destructive confirmation for groups, contacts, members, categories, and tags
- [Selection Controls](decisions/selection-controls.md) — native checkboxes/radios with selected and visibly locked states across forms, filters, and transfer
- [String Input Normalization](decisions/string-input-normalization.md) — required strings reject trimmed blanks; optional expense inputs have explicit blank-value semantics
- [Testing Strategy](decisions/testing-strategy.md) — Vitest and browser coverage boundaries; URGENT pending layout and shared-picker Playwright verification elsewhere

### Systems
- [IndexedDB Schema](systems/indexeddb-schema.md) — current tables, fixed-hundredths money, exact ratio metadata, and development schema policy

### Debugging
- [Browser App Installation](debugging/mobile-pwa-install.md) — Netlify manifest response type and browser-dependent desktop/mobile install prompts

### Workflows
- [Development Tools](workflows/development-tools.md) — typed realistic presets, randomized onboarding contacts, individual creation buttons, and persistence boundaries
- [Onboarding](workflows/onboarding.md) — implemented resumable setup plus Link/CSV/ZIP first-launch import with a short identity path
- [Group Creation](workflows/group-creation.md) — standalone 4-step flow; writes begin only on final submission and then run sequentially
- [Main Screen](workflows/main-screen.md) — group snapshot, readable mobile expense rows with category names, responsive Settings card, dashboard return, and expense correction
- [Paid-By](workflows/paid-by.md) — implemented frequent-payer selection, atomic ranking updates, recent-payer defaults, and multi-payer entry
- [People Directory](workflows/people-directory.md) — global friends list, per-group links for blocked contact deletion, and group-building picker
- [Member Management](workflows/member-management.md) — one-click add, mobile two-row member actions with name tooltip, confirmed removal, and persisted guards
- [Category Management](workflows/category-management.md) — group category CRUD, mobile sticky 50vh card/actions, in-form creation, and immediate detail changes; deactivation pending
- [Tag Management](workflows/tag-management.md) — group tags, mobile sticky 50vh card/actions, immediate detail selection/creation, and transactional cleanup
- [Filtering](workflows/filtering.md) — URL-backed filtering, mobile sticky toolbar and filtered-only count, accessible popover placement, sort modes, and expense insights
- [Dashboard](workflows/dashboard.md) — greeting, group summaries, mobile New group footer action, Unsettled subtitle, and category View all to full spending breakdown

### Ideas (captured, not committed)
- [Rewarded Ads](ideas/rewarded-ads.md) — optional ad-watch → credits → Pro unlock mechanic; fully opt-in
- [Itemized Split](ideas/itemized-split.md) — exploratory receipt-item assignment/OCR idea, separate from implemented receipt-file transfer
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
| Expense list + filtering           | DONE        |
| Balances / who-owes-whom view      | DONE        |
| Receipt attachments                | PENDING     |
| Group settings + deletion          | DONE        |
| Group transfer (Link / CSV / ZIP)  | DONE        |
| Group duplication                 | PENDING     |
| Whole-app ZIP backup and restore  | DONE        |
| Settlement sharing                | PENDING     |
| Installable/offline PWA support    | IN PROGRESS |
| Automated tests                    | IN PROGRESS |

The IndexedDB layer and Zustand store are complete for the current development scope. Schema
changes intentionally require resetting the local database; versioned migrations are not needed
while development data is disposable. All group-detail destinations have routes, but several are
lightweight or partial. Dashboard-level footer destinations have routes, although some remain
lightweight; see [[layout-architecture]].

Both reviewed defects are fixed for current writes: persisted tag cleanup cannot recreate deleted
expenses or overwrite newer edits, and saved ratio text preserves accepted shares through
reopening and editing. Legacy numeric ratio records remain readable, but digits already lost
cannot be recovered automatically; invalid legacy inputs need correction before saving. See
[[tag-management]] and [[expense-edit-delete]].

Expense filtering is implemented across eight logical fields with cross-field AND matching,
within-field OR selection, non-persisted group-local form state, active counts, and distinct empty
states. Utility coverage is complete for the current predicate and validation contract; direct UI
interaction coverage exercises every filter on desktop and mobile, and selected IDs deleted on
another group route are removed automatically when the list remounts. Eight URL-backed sort modes
apply after filtering without increasing the active count, including single-category and exact
tag-set grouping. See [[filtering]].

Group transfer is implemented as selective snapshot export and fresh editable import. Link is
bounded to 32,000 characters without receipts; CSV carries typed data without blobs; ZIP optionally
carries verified receipts. Fresh group-owned IDs, count/reference/integrity validation, recipient
identity mapping, default categories, same-name numbering, and the complete IndexedDB transaction
are covered on desktop and mobile. Settlement Link/PDF/Excel sharing remains separate and pending.
See [[import-export]].

The production build now has install metadata, a browser-dependent install dialog, an offline app
shell, background verified icon downloads with incremental repair, and a user-controlled update prompt. Desktop/mobile-emulated PWA
browser checks cover offline launch and cache repair. A real two-deployment update rehearsal,
physical-device verification, storage pressure behavior, and versioned IndexedDB upgrades remain
release checks; caches cannot guarantee
permanent storage. See [[mobile-pwa-install]], [[iconography]] and [[product-roadmap]].

---

## Key Invariants (Quick Reference)

1. Expense creation and editing enforce `sum(paid[].amount) == sum(owes[].amount)` with positive totals and safe-integer hundredths
2. People are global (one device-local directory); a group member is a link to a person, so the same person in two groups is one Person referenced twice
3. Balance = totalPaid − totalOwed (per member, per group) — not a running ledger
4. Categories can be renamed and guard-deleted now; new expenses omit inactive categories, while an edit may retain its current inactive category; the management toggle is planned
5. No global user in MVP/V2 — only a device-local `localUser`
6. Group creation automatically adds the LocalUser as a Member linked to their self Person; the picker excludes existing members, `addMember` atomically verifies referenced group/person existence and rejects duplicate links; `removeMember` blocks removing the local user, and `removePerson` checks persisted identity to block directory-wide self deletion
7. `categoryId` is mandatory on every expense — no uncategorised expenses
8. Currency is single per group (defaults to INR); Settings can relabel saved numbers without exchange conversion after confirmation — no mixed-currency expenses in MVP
9. Tags are named and colored group-scoped records referenced optionally through `Expense.tagIds`; deletion reads persisted group expenses and updates only their tag references in one transaction, then refreshes that group's expense state without recreating deleted expenses
10. A group must have at least one category — enforced at creation (categories step requires ≥1 selected) so every expense can be categorised
11. Expense creation and editing parse and store fixed integer hundredths for every currency; splits use deterministic largest-remainder allocation, and displays always use two decimal places
12. Expense creation and editing reject saves that would push total group spending above `Number.MAX_SAFE_INTEGER` hundredths; the check uses BigInt within the expense transaction to protect derived balances and displays, with updates replacing the old expense amount
13. Shares and percentage metadata are written as validated decimal strings and calculated with scaled BigInt weights; monetary adjustments remain integer hundredths. Legacy numeric ratios remain readable without automatic precision recovery
14. Export rejects inconsistent persisted receipt ownership before counting omissions; import never overwrites or merges a source group, creates fresh group-owned IDs in one transaction, and rehydrates Zustand only after commit
