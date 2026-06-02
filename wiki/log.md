# Wiki Log

Chronological record of all wiki changes.

---

## 2026-05-17
- CREATED wiki/index.md — bootstrapped wiki navigation hub
- CREATED wiki/log.md — chronological change record (Karpathy LLM Wiki pattern)
- CREATED architecture/domain-models.md — entity shapes and invariants
- CREATED architecture/balance-calculation.md — net balance algorithm + worked example
- CREATED architecture/state-management.md — Zustand store shape plan
- CREATED decisions/group-scoped-members.md — why no global user in MVP/V2
- CREATED decisions/expense-model-design.md — why both paid[] and owes[] are stored
- CREATED systems/indexeddb-schema.md — tables, keys, access patterns
- CREATED research/competitive-landscape.md — 10 competitors, fatal flaws, feature monopolies (from market research PDFs)
- CREATED research/market-opportunity.md — Splitwise paywall gap, positioning, differentiators, GTM
- CREATED research/user-pain-points.md — top complaints, 12 most-requested features, India pain points
- CREATED research/monetization-model.md — pricing tiers, what stays free, Splitwise anti-patterns
- UPDATED wiki/index.md — added Research section with 4 new pages

## 2026-05-17 (lint)
- UPDATED research/monetization-model.md — removed "Custom categories" from Pro features; categories are a free MVP feature (analytics + filtering tool, not a paid gating point)
- CREATED decisions/solo-group-support.md — solo groups (1 member) are valid; add-members onboarding step is skippable with an explanatory prompt; no minimum member count
- UPDATED wiki/index.md — added solo-group-support to Decisions section
- UPDATED architecture/state-management.md — noted that createGroup also auto-creates a Member record for LocalUser
- UPDATED wiki/index.md — added invariant #6: group creator is always auto-added as a Member and cannot be added again manually
- CREATED ideas/rewarded-ads.md — captured optional monetization idea (not committed); user watches ad → earns credits → unlocks Pro
- UPDATED wiki/index.md — added Ideas section for features that are captured but not committed to

## 2026-05-18
- CREATED decisions/import-export.md — three export formats (link/CSV/ZIP), two import modes (view-only/editable), UUID-based group matching, conflict resolution (add-new-only vs replace), receipt attachment compression strategy
- CREATED workflows/onboarding.md — standard first-launch flow and import-based alternative entry points
- CREATED workflows/main-screen.md — groups list home sorted by recency, in-group tabs, expense list structure
- UPDATED architecture/domain-models.md — added attachmentIds[] field to Expense; documented lazy-loading rationale
- UPDATED systems/indexeddb-schema.md — added attachments table (blob storage, expenseId index) and updated access pattern summary
- CREATED architecture/split-types.md — all 5 split types (equal, amount, shares, percentage, adjustment); mechanics, UX, validation rules, splitMeta storage rationale
- CREATED ideas/itemized-split.md — 6th split type idea; full design captured; deferred to V2/V3
- UPDATED architecture/domain-models.md — added when, splitType, splitMeta fields to Expense; clarified createdAt vs when distinction
- UPDATED wiki/index.md — added split-types to Architecture, itemized-split to Ideas
- UPDATED decisions/expense-model-design.md — revised to reflect that splitType and splitMeta are now stored; corrected earlier claim that "split type doesn't need to be stored after entry"
- CREATED workflows/paid-by.md — frequent payers quick-select UX, pre-selection logic, initial state for new groups, multi-payer mode, validation
- UPDATED architecture/domain-models.md — added frequentPayerIds[] to Group shape with initial value and update logic
- UPDATED systems/indexeddb-schema.md — added frequentPayerIds field to groups table
- UPDATED wiki/index.md — added paid-by to Workflows section
- CREATED decisions/expense-edit-delete.md — hard delete with attachment cascade, no access control in MVP, all fields editable, V3 note on admin controls
- UPDATED wiki/index.md — added expense-edit-delete to Decisions section
- CREATED workflows/member-management.md — add anytime, edit name/icon freely (ID-based references mean one-table update), removal blocked if member in any expense with filter-to-fix UX
- UPDATED wiki/index.md — added member-management to Workflows section
- UPDATED workflows/main-screen.md — clarified Balances tab is read-only in MVP; settlement + notifications confirmed as V2 with binary toggle; partial settlement deferred until user demand
- CREATED workflows/category-management.md — app master list concept, group creation selection step (skippable), custom categories, rename/deactivate rules, why no delete
- UPDATED workflows/onboarding.md — inserted category selection as step 4 (skippable) between group creation and add members; renumbered steps
- UPDATED wiki/index.md — added category-management to Workflows section

## 2026-05-18 (final pass — bug fixes + open questions)
- FIXED systems/indexeddb-schema.md — expenses table now includes when, splitType, splitMeta, attachmentIds; categoryId marked mandatory
- FIXED architecture/domain-models.md — removed stale "auto-created categories" note; added master list selection model; categoryId mandatory on expense; icons documented as emoji; deactivated categories stay visible on history
- FIXED architecture/state-management.md — updated Zustand store shape with all new fields and full action signatures
- UPDATED workflows/main-screen.md — expense list sorted by `when` descending; date shown is `when` not `createdAt`
- UPDATED workflows/member-management.md — added frequentPayerIds cleanup on member removal
- CREATED decisions/group-deletion.md — permanent deletion cascades all group data; irreversible warning
- UPDATED wiki/index.md — added group-deletion to Decisions section
- UPDATED architecture/domain-models.md — added currency field to Group (ISO 4217, defaults to INR, set at group creation)
- UPDATED systems/indexeddb-schema.md — added currency field to groups table
- UPDATED workflows/onboarding.md — added currency selection as step 4 (INR default, pre-filled); renumbered steps to 7 total
- CREATED workflows/filtering.md — 7 filterable expense fields, AND logic, non-persisted filter state
- UPDATED wiki/index.md — added filtering to Workflows section

## 2026-05-21
- CREATED workflows/tag-management.md — tag creation (inline + manage screen), rename, atomic delete with cascade, contrast with category no-delete rule
- UPDATED architecture/domain-models.md — added Tag model; added tagIds[] to Expense; added tag-management to Related section
- UPDATED systems/indexeddb-schema.md — added tags table (id, groupId, name); added tagIds field to expenses table; updated access pattern summary
- UPDATED workflows/filtering.md — added Tags multi-select as 8th filterable field; updated field count in overview
- UPDATED wiki/index.md — added tag-management to Workflows; updated filtering description to 8 fields; added invariant #9 (atomic tag deletion)

## 2026-05-18 (final consistency pass)
- UPDATED wiki/index.md — removed stale spec reference from header; corrected competitor count to 7; expanded implementation status to reflect full scope; added invariants 7 and 8
- UPDATED architecture/domain-models.md — corrected last-updated date to 2026-05-18
- UPDATED architecture/state-management.md — corrected last-updated date; fixed createGroup signature to include currency param; removed stale spec reference in Dexie.js note
- UPDATED decisions/solo-group-support.md — replaced restated onboarding steps (which were outdated) with a reference to [[onboarding]]
- UPDATED workflows/category-management.md — corrected group creation description to include currency step before category selection

## 2026-06-03
- UPDATED wiki/index.md — revised invariant #4: categories are deletable when unreferenced (reassign-first), no longer "never deleted"
- UPDATED workflows/category-management.md — Category Rules now allow guarded delete (unreferenced only; reassign all expenses first otherwise); added delete-vs-deactivate guidance
- UPDATED architecture/domain-models.md — category guarded-delete rule; clarified tag-vs-category deletion contrast (tags delete freely with cascade; categories only when unreferenced)
- UPDATED workflows/tag-management.md — updated tag-vs-category deletion contrast and Related note to match guarded category delete
- CREATED decisions/onboarding-persistence.md — per-step save + resumable onboarding: dedicated single-row `onboarding` store, monotonic `lastCompletedStep`, viewed step is Zustand-only, completion gated by explicit flag (not `localUser` presence)
- UPDATED workflows/onboarding.md — added Persistence & Resume section; linked onboarding-persistence
- UPDATED systems/indexeddb-schema.md — added `onboarding` single-row store (fixed key `'current'`)
- UPDATED wiki/index.md — added onboarding-persistence to Decisions; marked "IndexedDB layer + Zustand store" and "Onboarding flow" IN PROGRESS
