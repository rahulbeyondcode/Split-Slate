# split-slate Wiki

Synthesized knowledge for the split-slate expense splitting PWA.
This wiki is the sole persistent compiled knowledge layer. The implementation in `src/` remains
authoritative; `app-featureset-context/spec-sheet.md` is a historical baseline where later source
and approved decisions have superseded it. Changes: [log.md](log.md)

Last updated: 2026-10-10

---

> **HIGHEST PROJECT PRIORITY — ASK BEFORE RUNNING:** Tests, builds, lint, type checks,
> formatting/auto-fixes, Playwright/E2E/PWA, browser automation, watch tasks, servers, tool
> installation, and routine session-start/task-completion execution require explicit user approval.
> **No means no. Wait means wait and remind as requested, not execute.** Approval is limited to
> the agreed scope in the current session and never carries into a new one. Urgency, pending tasks,
> release gates, and conflicting project notes are not permission. Editing/commit approval is not
> verification approval. See [[testing-strategy]]; `AGENTS.md` and `CLAUDE.md` state the same gate.

---

> **Verification status (2026-10-10):** Lint, formatting, TypeScript, production build, and
> Devtools-enabled build pass. All 467 unit cases across 40 files and all 18 PWA cases pass.
> The final stable full-browser run passes 389 cases with 21 expected viewport-specific skips and
> zero failures, including the compact filter pills, mobile Filters, shared modal layout,
> group-settings editors, outer-only Expenses scrolling, payment tags, sidebar groups, and dashboard
> avatar previews/external aligned headings. Eight production responsive/offline smoke cases at
> 280–1920px pass in alternating light/dark themes with no horizontal pane overflow or browser errors.
> The initial 30 browser failures were repaired and all 115 applicable focused cases passed before
> the final full run. Skips are inapplicable project combinations; each passes in its appropriate
> project. Deployment-specific release checks remain outside this automated verification.
> Verification artifacts: `/tmp/opencode/full-verification-2026-10-10`. Future runs require approval.
> See [[testing-strategy]] and [[layout-architecture]].

---

## Navigation

### Roadmap
- [Product Direction and Roadmap](roadmap/product-roadmap.md) — verified narrow-mobile scaling, group duplication, PWA release gates, and implemented group-only repayment recording

### Architecture
- [Domain Models](architecture/domain-models.md) — expense and payment shapes, PNG icon keys, fixed-hundredths money, and optional group tags
- [Balance Calculation](architecture/balance-calculation.md) — safe payment-aware balances, expense-only spending, and deterministic suggested transfers
- [State Management](architecture/state-management.md) — Zustand hydration and transactional expense, payment, and group mutations
- [Split Types](architecture/split-types.md) — 5 split types with exact allocations and at-most-three-decimal display of percentages
- [Layout Architecture](architecture/layout-architecture.md) — responsive shell, transparent divided sidebar groups with bottom balances, inset modals with fixed controls, and viewport handling

### Decisions
- [Global People Directory](decisions/global-people-directory.md) — shared device-local people identities versus group-owned category labels; supersedes per-group members
- [Expense Model Design](decisions/expense-model-design.md) — fixed-hundredths paid/owed allocations and exact decimal ratio metadata, with numeric legacy read compatibility
- [Solo Group Support](decisions/solo-group-support.md) — single-member groups work; onboarding story names the solo path, while the shared member-step helper remains generic
- [Onboarding Persistence](decisions/onboarding-persistence.md) — resumable per-step standard setup plus atomic import-specific completion for fresh devices
- [Import / Export Design](decisions/import-export.md) — version 2 Link/CSV/ZIP includes payments; auto-scrolled questionnaire and one-click link copy, with version 1 imports supported
- [Whole-App Backup and Restore](decisions/full-backup.md) — matching neutral Settings action cards, distinct public entry panels, full ZIP snapshots, and replace-only recovery
- [Expense Edit and Delete](decisions/expense-edit-delete.md) — full editor, modal-confirmed deletion, and immediate reference-only category/tag changes without rebuilding splits
- [Group Deletion](decisions/group-deletion.md) — atomic owned-data and activity cascade retains only group-created/deleted entries and shared contacts
- [Money Representation and Rounding](decisions/money-representation-and-rounding.md) — implemented fixed hundredths for every currency, exact allocation, and confirmed no-conversion relabeling
- [Iconography](decisions/iconography.md) — shared featured-or-gallery PNG picker, offline caching and repair, Lucide controls, error illustrations, and onboarding artwork
- [Confirmation Dialogs](decisions/confirmation-dialogs.md) — shared in-app destructive confirmation for groups, expenses, contacts, members, categories, and tags
- [Selection Controls](decisions/selection-controls.md) — native checkboxes/radios with selected and visibly locked states across forms, filters, and transfer
- [Offline Payment Recording](decisions/settlement-recording.md) — group-only repayment records, modal entry with compact colour-labelled tags, correction, and portability
- [String Input Normalization](decisions/string-input-normalization.md) — required strings reject trimmed blanks; optional expense inputs have explicit blank-value semantics
- [Testing Strategy](decisions/testing-strategy.md) — approval-gated execution, 467 unit/389 browser/18 PWA passes, responsive/offline UI checks, and 21 explained project-specific skips

### Systems
- [IndexedDB Schema](systems/indexeddb-schema.md) — version 3 payments, safe expense/balance writes, and bootstrap recovery

### Debugging
- [Browser App Installation](debugging/mobile-pwa-install.md) — Netlify manifest response type, five-day install reminders, and Settings retry

### Workflows
- [Development Tools](workflows/development-tools.md) — typed realistic presets, randomized onboarding contacts, individual creation buttons, and persistence boundaries
- [Onboarding](workflows/onboarding.md) — stable intro rows, themed restore chooser, modal category/person drafts, and a fixed mobile currency heading above scrolling choices
- [Group Creation](workflows/group-creation.md) — standalone 4-step flow, cross-group category suggestions, and sequential save after final submission
- [Main Screen](workflows/main-screen.md) — group navigation including tablet Activity and sidebar Balances, counted Recent transactions, and expense workflows
- [Paid-By](workflows/paid-by.md) — emoji payer pills, filled edit contributions, live suggestions, and single-message red validation
- [People Directory](workflows/people-directory.md) — shared contacts with expense/payment-aware deletion guards; mobile route lacks an in-app entry point
- [Member Management](workflows/member-management.md) — setup person-draft modals with initial field focus and visible actions, directory linking, and guarded removal
- [Category Management](workflows/category-management.md) — all-width management and setup modals, draft-only category entry, and guarded deletion; deactivation pending
- [Tag Management](workflows/tag-management.md) — group-scoped tags, all-width Add/Edit modal, tablet-stacked cards, and transactional cleanup
- [Filtering](workflows/filtering.md) — outer-only Expenses scrolling, horizontal filter pills, mobile Filters modal/wider popover, and URL-backed Analytics drill-down
- [Dashboard](workflows/dashboard.md) — five-member avatar previews, external summary headings with aligned side-by-side boxes, tablet Activity navigation, group-only Analytics links, and scoped totals

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
| People directory (friends list)    | IN PROGRESS |
| Member management                  | DONE        |
| Category management                | IN PROGRESS |
| Tag management                     | IN PROGRESS |
| Add expense                       | DONE        |
| Edit / delete expense             | DONE        |
| Split types (5 types)              | DONE        |
| Paid-by (frequent payers UI)       | DONE        |
| Expense list + filtering           | DONE        |
| Mobile expense-form scroll/actions | AUTOMATED VERIFIED |
| Balances / who-owes-whom view      | DONE        |
| Offline repayment recording        | DONE        |
| Receipt attachments                | PENDING     |
| Group settings + deletion          | DONE        |
| Group transfer (Link / CSV / ZIP)  | DONE        |
| Group duplication                 | PENDING     |
| Whole-app ZIP backup and restore  | DONE        |
| Settlement sharing                | PENDING     |
| Installable/offline PWA support    | IN PROGRESS |
| Automated tests                    | IN PROGRESS |

The Contacts screen supports contact CRUD, but `/friends` has no in-app mobile entry point. See
[[people-directory]].

The IndexedDB layer and Zustand store are complete for the current development scope. Dexie
version 2 adds activity events and version 3 adds payments without clearing existing data. All group-detail
destinations have routes, but several are lightweight or partial. Dashboard-level footer
destinations have routes, although some remain lightweight; see [[layout-architecture]].

Balances include recorded payments made outside the app; the suggestions themselves are read-only.
Payments do not rewrite expenses or spending analytics. See [[settlement-recording]] and
[[balance-calculation]].

Both reviewed defects are fixed for current writes: persisted tag cleanup cannot recreate deleted
expenses or overwrite newer edits, and saved ratio text preserves accepted shares through
reopening and editing. Legacy numeric ratio records remain readable, but digits already lost
cannot be recovered automatically; invalid legacy inputs need correction before saving. See
[[tag-management]] and [[expense-edit-delete]].

Expense filtering is implemented across eight logical fields with cross-field AND matching,
within-field OR selection, URL-backed state (not IndexedDB persistence), active counts, and distinct
empty states. Utility tests cover the current predicate and validation contract; browser suites
exercise filters on desktop and mobile in the passing full suite.
Selected IDs deleted on another group route are removed automatically when the list remounts.
Eight URL-backed sort modes apply after filtering without increasing the active count, including
single-category and exact tag-set grouping. See [[filtering]].

Group transfer is implemented as selective snapshot export and fresh editable import. Link is
bounded to 32,000 characters without receipts; CSV carries typed data without blobs; ZIP optionally
carries verified receipts. Fresh group-owned IDs, count/reference/integrity validation, recipient
identity mapping, default categories, same-name numbering, and the complete IndexedDB transaction
have passing desktop/mobile browser journeys in the 2026-10-10 post-scaling full suite, including
opening the export questionnaire. Settlement Link/PDF/Excel
sharing remains separate and pending.
See [[import-export]] and [[testing-strategy]].

The production build now has install metadata, a five-day install reminder with a Settings retry, an offline app
shell, background verified icon downloads with incremental repair, and a user-controlled update prompt. Desktop/mobile-emulated PWA
browser checks cover offline launch and cache repair. A real two-deployment update rehearsal,
storage pressure behavior, and versioned IndexedDB upgrades remain release checks; caches cannot guarantee
permanent storage. See [[mobile-pwa-install]], [[iconography]] and [[product-roadmap]].

---

## Key Invariants (Quick Reference)

1. Expense creation and editing enforce `sum(paid[].amount) == sum(owes[].amount)` with positive totals and safe-integer hundredths
2. People are global (one device-local directory); a group member is a link to a person, so the same person in two groups is one Person referenced twice
3. Balance = expense paid − expense owed + external payments made − external payments received (per member, per group); spending totals remain expense-only
4. Categories can be renamed and guard-deleted now; new expenses omit inactive categories, while an edit may retain its current inactive category; the management toggle is planned
5. No global user in MVP/V2 — only a device-local `localUser`
6. Group creation automatically adds the LocalUser as a Member linked to their self Person; the picker excludes existing members, `addMember` atomically verifies referenced group/person existence and rejects duplicate links; `removeMember` blocks removing the local user, and `removePerson` checks persisted identity to block directory-wide self deletion
7. `categoryId` is mandatory on every expense — no uncategorised expenses
8. Currency is single per group (defaults to INR); Settings can relabel saved numbers without exchange conversion after confirmation — no mixed-currency expenses in MVP
9. Tags are named and colored group-scoped records referenced optionally by expenses and payments; deletion updates persisted tag references in one transaction without recreating deleted records
10. A group must have at least one category — enforced at creation (categories step requires ≥1 selected) so every expense can be categorised
11. Expense creation and editing parse and store fixed integer hundredths for every currency; splits use deterministic largest-remainder allocation, and displays always use two decimal places
12. Expense creation and editing reject saves that would push total group spending above `Number.MAX_SAFE_INTEGER` hundredths; the check uses BigInt within the expense transaction to protect derived balances and displays, with updates replacing the old expense amount
13. Shares and percentage metadata are written as validated decimal strings and calculated with scaled BigInt weights; monetary adjustments remain integer hundredths. Legacy numeric ratios remain readable without automatic precision recovery
14. Export rejects inconsistent persisted receipt ownership before counting omissions; import never overwrites or merges a source group, creates fresh group-owned IDs in one transaction, and rehydrates Zustand only after commit
