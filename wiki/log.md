# Wiki Log

Reverse-chronological record of all wiki changes.

Entries record historical changes, not current execution instructions. The explicit-user-approval
policy in [[testing-strategy]], `AGENTS.md`, and `CLAUDE.md` supersedes older automatic-run or
"highest-priority next task" directives. Historical results do not authorize new runs.

Last updated: 2026-10-10

---

## 2026-10-10
- UPDATED decisions/testing-strategy.md — explain all 18 project-specific skips and remove device-pending wording without adding verification claims
- UPDATED architecture/layout-architecture.md — remove device-pending labels while retaining factual automated coverage
- UPDATED workflows/main-screen.md — replace stale post-scaling pending status with the passing full-browser result
- UPDATED roadmap/product-roadmap.md — remove the device-validation gate and reconcile root-scaling browser coverage
- UPDATED debugging/mobile-pwa-install.md — remove the outstanding device install-rehearsal statement
- UPDATED wiki/index.md — reflect scope-aware skips and remove device-pending status labels
- UPDATED decisions/testing-strategy.md — record final passing static checks, both builds, 467 unit cases, 314 browser cases with 18 expected skips, 18 PWA cases, and responsive/offline Analytics verification
- UPDATED architecture/layout-architecture.md — replace stale unverified-full-suite claim with the passing automated baseline while retaining the physical-device limitation
- UPDATED workflows/filtering.md — record passing group Analytics drill-down, seven-width overflow checks, and production offline reload coverage
- UPDATED wiki/index.md — refresh verification summary, post-scaling transfer coverage, and automated-versus-device status

## 2026-10-09
- UPDATED workflows/filtering.md — document all-width group Analytics category drill-down with fresh URL-backed filters and pending added browser cases
- UPDATED workflows/dashboard.md — distinguish clickable group Analytics categories from noninteractive app-wide rows
- UPDATED wiki/index.md — reflect group-only Analytics category drill-down
- UPDATED architecture/layout-architecture.md — tablet app/group Activity sidebar links, desktop direct-route behavior, and pending mobile group entry point
- UPDATED workflows/dashboard.md — distinguish app-wide and group-only Activity feeds on tablet
- UPDATED workflows/main-screen.md — document the group-scoped Activity route and tablet sidebar link
- UPDATED wiki/index.md — reflect tablet Activity navigation and undecided mobile group access
- UPDATED architecture/split-types.md — round displayed percentage placeholders, summaries, and details to at most three places without changing exact calculations or edit values
- UPDATED architecture/layout-architecture.md — add Balances to the group sidebar on tablet/desktop only
- UPDATED workflows/main-screen.md — clarify group-only sidebar Balances navigation
- UPDATED wiki/index.md — reflect display-only percentage rounding and group-sidebar Balances
- UPDATED architecture/split-types.md — document Shares-only range errors and distinct Percentage validation messages
- UPDATED wiki/index.md — reflect method-specific split validation
- UPDATED architecture/split-types.md — show green Unequal/Percentage summaries only after a selected field is entered
- UPDATED wiki/index.md — clarify entered-value-only split summaries
- UPDATED architecture/split-types.md — restrict green summaries to Unequal and Percentage, bolding only numeric values
- UPDATED wiki/index.md — reflect restricted, value-emphasized split summaries
- UPDATED architecture/split-types.md — document contextual green split summaries and single-message inline validation
- UPDATED workflows/paid-by.md — document single-message red payer validation without a duplicate alert
- UPDATED wiki/index.md — reflect green split summaries and payer validation placement
- UPDATED architecture/split-types.md — clarify that zero-suggested percentage members are omitted from owed rows and resolved percentages are stored
- UPDATED wiki/index.md — clarify percentage split navigation description
- UPDATED architecture/split-types.md — document percentage suggestion placeholders, exact saved allocations, input capping, zero omission, and center-aligned values
- UPDATED workflows/paid-by.md — document prefilled edit contributions and deferred remainder handoff
- UPDATED wiki/index.md — reflect percentage suggestions and filled edit payers
- UPDATED workflows/paid-by.md — clarify that the recent payer default applies to single-payer mode; new multiple-payer drafts start unselected
- UPDATED wiki/index.md — distinguish single-payer default from new multi-payer selection
- UPDATED workflows/paid-by.md — replace provisional all-member input rows with shared emoji pills, checkbox selection, rounded suggestions and paid-only persistence
- UPDATED wiki/index.md — reflect pill-based single/multiple payer entry and suggested amounts
- UPDATED architecture/split-types.md — replace stale placeholder UX with method headings and owed-amount previews above compact member rows
- UPDATED workflows/paid-by.md — document matching compact multi-payer rows and explicit input guidance
- UPDATED wiki/index.md — reflect visible split headings and placeholder-free payer inputs
- UPDATED architecture/split-types.md — document all-width participant rows, Unequal UI label, numeric entry filter and provisional previews without changing save validation
- UPDATED workflows/main-screen.md — describe shared expense split-row layout, selection, icons and live amounts at every width
- UPDATED wiki/index.md — reflect updated split UI and expense workflow navigation
- UPDATED architecture/layout-architecture.md — keep app-wide Analytics and Unsettled Back/title visible while subtitle and content scroll at every width
- UPDATED wiki/index.md — reflect sticky Analytics/Unsettled headers in layout navigation
- UPDATED architecture/layout-architecture.md — extend the desktop activity pane to app-wide Analytics and Unsettled and document history-based Back controls
- UPDATED workflows/dashboard.md — describe app-wide activity visibility and Back behavior for both dashboard destinations
- UPDATED wiki/index.md — reflect Analytics/Unsettled activity and Back navigation in wiki links
- UPDATED workflows/onboarding.md — clarify the fixed mobile currency title/subtitle and separately scrolling choices
- UPDATED wiki/index.md — reflect fixed mobile currency heading in onboarding navigation
- UPDATED decisions/testing-strategy.md — reconcile earlier pending-verification statements with completed focused checks while retaining historical result boundaries
- UPDATED wiki/index.md — surface passing targeted fixes without implying a new full-suite run
- UPDATED decisions/testing-strategy.md — record passing targeted fixes and split theme matrix, final responsive evidence, and the verified Netlify fixture correction without claiming a post-fix full-suite run
- UPDATED architecture/layout-architecture.md — distinguish passing focused browser/visual checks from unverified physical-device and post-fix full-suite behavior
- UPDATED wiki/index.md — synchronize final verification results and remaining deployment/device boundaries
- UPDATED workflows/member-management.md — explain first-field focus after native dialog opening and the overflowing-body autofocus pitfall
- UPDATED decisions/testing-strategy.md — record six passing theme regressions and focused verification of modal focus and resize-synchronized measurements
- UPDATED wiki/index.md — distinguish verified theme checks from pending focus/resize scenarios
- UPDATED architecture/layout-architecture.md — document pre-paint saved-theme initialization outside the app shell and reconcile entry-page Back styling with guarded-home navigation
- UPDATED decisions/testing-strategy.md — record the completed browser run and responsive evidence, with post-fix verification pending
- UPDATED wiki/index.md — reflect saved-theme initialization and the remaining browser verification failures
- UPDATED decisions/testing-strategy.md — document browser-side loading of asset-dependent modules and verified UI/policy checks, with full browser and visual verification pending
- UPDATED wiki/index.md — distinguish current passing checks from pending browser and visual validation
- UPDATED AGENTS.md — replace the stale automatic-first verification directive with explicit user approval as the highest project priority; reconcile formatting, source-correction, and hierarchy wording
- UPDATED CLAUDE.md — mirror the execution-approval gate and resolve the same conflicting instructions
- UPDATED decisions/testing-strategy.md — require scoped current-session permission for verification, routine execution, installations, and watch tasks; keep deferred checks unverified
- UPDATED wiki/index.md — prominently surface the approval gate and distinguish pending validation from permission
- UPDATED wiki/log.md — mark historical automatic-run directives as superseded, preserving the change history
- UPDATED decisions/full-backup.md — document matching neutral Settings transfer/backup cards with regular labels and no selected-state emphasis
- UPDATED wiki/index.md — reflect neutral Settings action styling
- UPDATED decisions/full-backup.md — document responsive themed Settings backup/restore action cards and preserved download progress behavior
- UPDATED wiki/index.md — reflect Settings backup action presentation
- UPDATED workflows/member-management.md — document bounded setup person-editor scrolling with a visible title and action footer
- UPDATED wiki/index.md — reflect visible actions in setup person modals
- UPDATED workflows/onboarding.md — document modal person drafts, preserved selections, and the existing Save and Finish guard
- UPDATED workflows/member-management.md — distinguish all-width setup person modals from post-creation member management
- UPDATED wiki/index.md — reflect modal draft-person entry in onboarding and member navigation
- UPDATED architecture/layout-architecture.md — make Import and Restore Back to SplitSlate links share guarded-home navigation instead of browser history
- UPDATED wiki/index.md — reflect consistent import/restore home navigation
- UPDATED decisions/full-backup.md — document shared responsive entry-page layouts and distinct teal/slate-blue panels without changing app colors or restore behavior
- UPDATED wiki/index.md — reflect the shared import/restore entry-page presentation
- UPDATED workflows/onboarding.md — document one mobile currency-form scroller, visible actions, and a compact decorative header below 750px
- UPDATED wiki/index.md — reflect mobile currency-form layout in onboarding navigation

## 2026-10-08
- UPDATED workflows/onboarding.md — document modal category drafts with Cancel/Escape and focus return
- UPDATED workflows/category-management.md — document shared onboarding/new-group category modals and correct the stale desktop inline-editor claim
- UPDATED wiki/index.md — reflect modal category entry in onboarding and category-management navigation
- UPDATED workflows/onboarding.md — document the themed restore chooser, shared text space, and full-width first Next action
- UPDATED wiki/index.md — reflect the onboarding restore entry point and stable carousel layout
- UPDATED decisions/testing-strategy.md — record post-scaling lint/build/unit/PWA results and corrected root-scale-aware browser assumptions pending verification
- UPDATED wiki/index.md — reflect verified post-scaling checks and remaining browser/device gates
- UPDATED architecture/layout-architecture.md — document bounded narrow-mobile root scaling, rem conversion invariants, preserved sizing exceptions, and baseline-only scroll verification
- UPDATED workflows/filtering.md — record conditional payment-timeline merging that preserves selected non-date expense sorts
- UPDATED decisions/testing-strategy.md — distinguish the repaired passing baseline from unverified post-scaling browser/device behavior
- UPDATED workflows/main-screen.md — replace the unverified baseline form-scroll claim with passing pre-scaling coverage and pending root-scaling validation
- UPDATED roadmap/product-roadmap.md — make post-scaling device validation the current mobile layout gate
- UPDATED wiki/index.md — clear the unrun-baseline notice and synchronize layout, filtering, and verification summaries

## 2026-10-06
- UPDATED wiki/index.md — flag unrun lint/build/tests for the latest commit as the highest-priority next task
- UPDATED AGENTS.md — require running lint, build, and tests before any other task
- UPDATED decisions/import-export.md — document scrolling to the revealed Group Settings export questionnaire at every width
- UPDATED wiki/index.md — reflect the auto-scrolled export questionnaire
- UPDATED decisions/import-export.md — replace generated-link field and separate Copy action with one-click clipboard copy and inline success feedback
- UPDATED wiki/index.md — reflect one-click transfer-link copying
- UPDATED architecture/layout-architecture.md — document mobile Categories & Tags main-pane and card scrolling without window scrolling
- UPDATED workflows/main-screen.md — describe the scroll boundary and all-width management dialogs
- UPDATED workflows/category-management.md — describe all-width Add/Edit modal and mobile scroll boundary
- UPDATED workflows/tag-management.md — describe all-width Add/Edit modal and mobile scroll boundary
- UPDATED wiki/index.md — update Categories & Tags layout and dialog summaries
- UPDATED workflows/main-screen.md — stack Categories and Tags on tablet while preserving desktop columns
- UPDATED workflows/category-management.md — document short-name desktop actions beside category titles and long-name wrapping
- UPDATED workflows/tag-management.md — document tablet stacking and short-name desktop action alignment
- UPDATED wiki/index.md — reflect responsive Categories and Tags layouts
- UPDATED workflows/filtering.md — document solid sticky Expenses backgrounds and coverage of the filter-bar spacing
- UPDATED wiki/index.md — reflect the opaque sticky expense toolbar
- UPDATED workflows/category-management.md — remove inline category usage counts so full names can wrap; retain counts in blocked-delete dialogs
- UPDATED wiki/index.md — reflect category name and usage-count placement
- UPDATED architecture/layout-architecture.md — restore plain Back to dashboard links without changing other Back controls
- UPDATED workflows/main-screen.md — distinguish plain mobile dashboard navigation from secondary Back buttons
- UPDATED wiki/index.md — reflect original dashboard Back styling in Layout Architecture navigation
- UPDATED workflows/main-screen.md — call the expense/payment preview Recent transactions without including edit/delete activity
- UPDATED wiki/index.md — reflect the concise Recent transactions heading
- UPDATED workflows/main-screen.md — distinguish recent expense/payment entries from the separate edit/delete activity pane
- UPDATED wiki/index.md — name the recent-entry card without conflating it with activity history
- UPDATED workflows/main-screen.md — shorten Recent activity heading and move the full expense/payment count to its bordered View all action
- UPDATED wiki/index.md — reflect the counted Recent activity navigation
- UPDATED workflows/main-screen.md — place recent expense/payment title and View all inside its card, including empty state
- UPDATED wiki/index.md — reflect in-card recent-activity navigation on Overview
- UPDATED workflows/main-screen.md — stack Members and Suggested transfers preview cards on tablets
- UPDATED wiki/index.md — reflect tablet Overview stacking
- UPDATED workflows/main-screen.md — describe centered overview CTAs, three-transfer preview and counts, and tablet-stacked Balances
- UPDATED workflows/category-management.md — move dark Add category action above the card and remove mobile section stickiness
- UPDATED workflows/tag-management.md — move dark Add tag action above the card and remove mobile section stickiness
- UPDATED wiki/index.md — reflect updated overview, Balances, and Categories & Tags layouts
- UPDATED workflows/main-screen.md — make Settle up stand out on transfer cards and rely on the existing payment explanation
- UPDATED wiki/index.md — reflect prominent transfer actions in Main Screen navigation
- UPDATED workflows/main-screen.md — describe the revised suggested-transfer cards and subdued disclaimer
- UPDATED wiki/index.md — reflect the transfer-card design in Main Screen navigation
- UPDATED workflows/main-screen.md — keep the mobile split checkbox label as Select all in both states
- UPDATED wiki/index.md — reflect the fixed-label Select all control in Main Screen navigation
- UPDATED workflows/main-screen.md — replace mobile split Select/Unselect buttons with a clickable All checkbox
- UPDATED wiki/index.md — refresh Main Screen expense-entry navigation
- UPDATED workflows/main-screen.md — describe scoped mobile expense-form scroll implementation and split/add-pill layout without claiming browser verification
- UPDATED architecture/layout-architecture.md — record intended single main-pane scroll on mobile expense forms and verification caveat
- UPDATED decisions/testing-strategy.md — add mobile form scroll browser case and retain unverified status
- UPDATED wiki/index.md — reflect pending mobile scroll browser verification
- UPDATED architecture/layout-architecture.md — document group Analytics spacing and consistent secondary Back controls
- UPDATED workflows/main-screen.md — document Back styling and correct desktop/tablet Expenses scroll behavior
- UPDATED wiki/index.md — refresh layout and Main Screen navigation

## 2026-10-05
- UPDATED workflows/main-screen.md — replace compact full-width Settle up description with spacious rows and right-aligned content-sized action
- UPDATED wiki/index.md — reflect roomier settlement suggestions in Main Screen navigation
- UPDATED workflows/main-screen.md — describe compact suggested-transfer rows with shared amount and Settle up line
- UPDATED wiki/index.md — refresh Main Screen navigation for settlement suggestion layout
- UPDATED architecture/layout-architecture.md — replace viewport-locked desktop/tablet Expenses with pane scrolling and a ten-entry inner ledger
- UPDATED workflows/filtering.md — document all-viewport insights scroll-away and measured ten-row desktop/tablet ledger
- UPDATED wiki/index.md — refresh layout and filtering navigation for expense scrolling
- UPDATED workflows/main-screen.md — document shared all-viewport Hour-to-Minute and empty-Minute Backspace focus rules
- UPDATED wiki/index.md — reflect cross-device time-entry behavior in Main Screen navigation
- UPDATED workflows/main-screen.md — document modal payment entry, searchable member dropdowns, shared time controls, and separated Settle up action
- UPDATED decisions/settlement-recording.md — record payment-entry interaction and explicit-time behavior
- UPDATED wiki/index.md — refresh payment form navigation descriptions
- UPDATED workflows/main-screen.md — correct sidebar net and chronological payment-row descriptions
- UPDATED wiki/index.md — clarify mixed-ledger navigation
- UPDATED systems/indexeddb-schema.md — keep expense write invariants in expense section and record balance guard
- UPDATED wiki/index.md — clarify database invariant summary
- UPDATED architecture/balance-calculation.md — record cross-mutation safe-balance validation
- UPDATED wiki/index.md — note safe payment-aware balance boundary
- UPDATED workflows/people-directory.md — document expense/payment-aware blocked deletion links
- UPDATED wiki/index.md — refresh People Directory deletion summary
- UPDATED workflows/member-management.md — reflect payment-aware blocking and transactional deletion
- UPDATED wiki/index.md — refresh member-management guard summary
- UPDATED roadmap/product-roadmap.md — mark approved group-only external payment recording implemented
- UPDATED wiki/index.md — update roadmap navigation
- UPDATED decisions/import-export.md — record payment inclusion and old-transfer compatibility
- UPDATED decisions/full-backup.md — record payment rows/events and old-backup compatibility
- UPDATED wiki/index.md — refresh portability navigation
- UPDATED workflows/main-screen.md — document payment form, balances, and mixed activity rows
- UPDATED wiki/index.md — refresh Main Screen payment navigation
- UPDATED systems/indexeddb-schema.md — describe version 3 payment rows and lifecycle
- UPDATED wiki/index.md — update database navigation and migration status
- UPDATED architecture/balance-calculation.md — explain external payment effects without changing spending
- UPDATED architecture/domain-models.md — define payment row and optional tag references
- UPDATED architecture/state-management.md — describe payment slice and hydration
- UPDATED wiki/index.md — refresh architecture navigation for recorded payments
- CREATED decisions/settlement-recording.md — document approved group-only external payment model
- UPDATED wiki/index.md — link payment decision and mark recording implemented
- UPDATED wiki/log.md — record approved offline payment decision
- UPDATED workflows/main-screen.md — align the pending settlement workflow with approved external repayment recording
- UPDATED wiki/index.md — reflect the corrected Main Screen settlement summary
- UPDATED wiki/log.md — record the approved Main Screen settlement correction
- UPDATED roadmap/product-roadmap.md — approve device-local recording of external repayments while retaining implementation decision gates
- UPDATED wiki/index.md — distinguish pending repayment recording from implemented read-only balances
- UPDATED wiki/log.md — record the approved settlement-direction update
- UPDATED decisions/global-people-directory.md — distinguish shared people identities from recurring group-owned category names
- UPDATED wiki/index.md — clarify the people-directory decision in navigation
- UPDATED wiki/log.md — record the approved people-versus-category clarification
- UPDATED decisions/group-deletion.md — retain only group-created/deleted activity after atomic cascade
- UPDATED workflows/category-management.md — document cross-group name/icon suggestions and exact-name spending
- UPDATED workflows/tag-management.md — document cross-group tag name/color suggestions
- UPDATED workflows/group-creation.md — document draft suggestions and correct atomic group/creator event write
- UPDATED workflows/onboarding.md — document suggestion selection in the shared category step
- UPDATED workflows/dashboard.md — clarify exact-name totals and group-deletion activity retention
- UPDATED architecture/state-management.md — record transactional activity pruning and post-commit refresh
- UPDATED systems/indexeddb-schema.md — clarify activity snapshot lifetime after group deletion
- UPDATED architecture/layout-architecture.md — qualify deleted-item rows after group deletion
- UPDATED wiki/index.md — update all affected navigation descriptions
- UPDATED wiki/log.md — record approved activity retention and cross-group suggestions
- UPDATED decisions/testing-strategy.md — record the green 2026-10-05 check, unit, full browser, and PWA runs
- UPDATED roadmap/product-roadmap.md — mark browser-suite failure investigation resolved by the green run
- UPDATED workflows/main-screen.md — replace the stale desktop filter failure with the passing full-run status
- UPDATED architecture/layout-architecture.md — reconcile the Categories & Tags window-scroll caveat with the current test
- UPDATED wiki/index.md — refresh Testing Strategy and filtering summaries for the green full run
- UPDATED wiki/log.md — record approved test-status and stale-claim corrections
- UPDATED workflows/dashboard.md — clarify group Analytics history-first Back button and direct-visit fallback
- UPDATED architecture/layout-architecture.md — document Back navigation on both desktop and mobile group Analytics
- UPDATED wiki/index.md — reflect group Analytics return navigation
- UPDATED wiki/log.md — record approved group Analytics Back behavior
- UPDATED workflows/dashboard.md — distinguish app-wide and group-scoped category previews and analytics
- UPDATED workflows/main-screen.md — document five recent expenses and group Analytics route
- UPDATED architecture/layout-architecture.md — describe group Analytics within the group shell without a new footer tab
- UPDATED wiki/index.md — reflect scoped Analytics and five-expense group overview
- UPDATED wiki/log.md — record approved group-spending documentation changes
- UPDATED decisions/confirmation-dialogs.md — add expense deletion to shared modal confirmation behavior
- UPDATED decisions/expense-edit-delete.md — document modal cancellation and retry on failed deletion
- UPDATED wiki/index.md — surface modal-confirmed expense deletion in wiki navigation
- UPDATED wiki/log.md — record approved expense deletion confirmation change
- UPDATED decisions/full-backup.md — accept completed onboarding with a null group reference after deletion and replacement, while rejecting dangling IDs
- UPDATED wiki/index.md — reflect the corrected whole-app backup validation boundary
- UPDATED wiki/log.md — record approved backup reference correction
- UPDATED architecture/layout-architecture.md — replace remaining expense-only panel claim with saved action events
- UPDATED roadmap/product-roadmap.md — distinguish implemented action snapshots from earlier unrecoverable changes
- UPDATED workflows/dashboard.md — reconcile saved events and legacy expense fallbacks with prior chart and activity corrections
- UPDATED architecture/state-management.md — retain bootstrap recovery and draft behavior while documenting activity-event transaction scopes
- UPDATED systems/indexeddb-schema.md — retain recovery behavior and document the version 2 upgrade
- UPDATED wiki/index.md — merge activity, install, and wiki-reconciliation navigation and status
- UPDATED wiki/log.md — combine both approved histories and record conflict reconciliation
- UPDATED architecture/domain-models.md — correct tag-chip visibility in expense and Overview rows
- UPDATED architecture/state-management.md — correct current group-draft subscription and preview routing claims
- UPDATED workflows/people-directory.md — distinguish stored self Person from visible contacts and note missing mobile entry point
- UPDATED workflows/dashboard.md — correct compact activity placement and spending-chart display with mixed currencies or no expenses
- UPDATED wiki/index.md — reflect corrected behavior and mobile Contacts access gap
- UPDATED wiki/log.md — record approved cross-verification corrections

## 2026-10-04
- UPDATED decisions/testing-strategy.md — correct Playwright root and coverage, record current run failures, and isolate unverified mobile-form scrolling
- UPDATED workflows/group-creation.md — distinguish group and creator writes from an atomic transaction
- UPDATED workflows/member-management.md — specify sequential, non-atomic deletion boundaries
- UPDATED architecture/domain-models.md — correct expense time default and recording-date visibility
- UPDATED architecture/layout-architecture.md — document mobile form-footer exception, PNG group avatars, and observed long-page window scrolling
- UPDATED architecture/state-management.md — include initError, recovery flow, and focused expense-detail mutation
- UPDATED systems/indexeddb-schema.md — correct icon keys, time default, and bootstrap recovery behavior
- UPDATED decisions/global-people-directory.md — qualify voluntary person-snapshot export and add purpose
- UPDATED decisions/onboarding-persistence.md — add page purpose
- UPDATED decisions/solo-group-support.md — distinguish explicit onboarding solo story from shared helper text
- UPDATED decisions/money-representation-and-rounding.md — correct historical deployment wording and implemented import limit
- UPDATED decisions/import-export.md — remove obsolete browser-suite repair pairing from duplication plan
- UPDATED workflows/people-directory.md — use current Contacts label and PNG picker description
- UPDATED workflows/onboarding.md — remove resolved identity-guard gaps and clarify final save button
- UPDATED workflows/category-management.md — describe PNG image keys and add page purpose
- UPDATED workflows/main-screen.md — remove obsolete Help/menu and tab terminology
- UPDATED workflows/dashboard.md — separate implemented summaries and expense-derived activity from future history
- UPDATED ideas/category-settings-ui.md — add page purpose
- UPDATED ideas/rewarded-ads.md — add page purpose
- UPDATED roadmap/product-roadmap.md — prioritize current browser-suite failures and mobile form repair, correct defaults and completed work
- UPDATED wiki/index.md — reconcile navigation and current implementation summaries with corrected pages
- UPDATED wiki/log.md — record approved wiki-wide source reconciliation
- UPDATED debugging/mobile-pwa-install.md — document five-day install reminders, legacy dismissal recovery, and Settings retry
- UPDATED wiki/index.md — surface the revised install flow in navigation and implementation status
- UPDATED wiki/log.md — record the approved install-flow documentation update
- UPDATED decisions/group-deletion.md — distinguish deleted domain data from retained activity snapshots
- UPDATED wiki/index.md — reflect group-deletion history behavior in navigation
- UPDATED wiki/log.md — record approved group-deletion documentation correction
- UPDATED workflows/dashboard.md — distinguish saved action history from legacy expense previews
- UPDATED architecture/layout-architecture.md — document persistent desktop action feed
- UPDATED architecture/state-management.md — describe atomic event writes, hydration, and update date
- UPDATED systems/indexeddb-schema.md — document version 2 activity table and correct bootstrap error handling
- UPDATED decisions/full-backup.md — include activity snapshots and compatible older backups
- UPDATED wiki/index.md — link updated activity, schema, and backup descriptions
- UPDATED wiki/log.md — record approved activity history documentation
- UPDATED workflows/category-management.md — document mobile-only add/edit modals with desktop/tablet inline forms
- UPDATED workflows/tag-management.md — document mobile-only management add/edit modals with desktop/tablet inline forms
- UPDATED workflows/member-management.md — document mobile-only add/edit person modals including existing-friend selection
- UPDATED wiki/index.md — surface mobile-only management modal behavior
- UPDATED wiki/log.md — record the approved mobile management modal change
- UPDATED workflows/main-screen.md — mark the unresolved mobile expense scroll/action issue urgent after rolling back failed scroll changes
- UPDATED wiki/index.md — flag mobile expense-form scroll/actions as urgent and unresolved
- UPDATED wiki/log.md — record the approved scroll-only rollback and urgent follow-up
- UPDATED workflows/main-screen.md — correct mobile form scroll contract after the nested-fieldset clipping regression; browser verification remains pending
- UPDATED wiki/index.md — remove the unverified claim that mobile expense scrolling has no blank tail
- UPDATED wiki/log.md — record the approved scroll correction and documentation update
- UPDATED workflows/main-screen.md — clarify mobile expense-form scroll ending, bulk split selection, and inline tag creation
- UPDATED workflows/tag-management.md — document mobile expense-form tag creation and the persistence boundary
- UPDATED wiki/index.md — surface mobile form scroll, bulk split, and tag creation behavior
- UPDATED wiki/log.md — record the approved mobile expense-form follow-up
- UPDATED workflows/main-screen.md — document mobile fixed expense actions, hour focus, and full-row split selection
- UPDATED wiki/index.md — surface mobile expense form behavior in the navigation summary
- UPDATED wiki/log.md — record the approved mobile expense form update
- UPDATED decisions/iconography.md — document the shared picker replacing featured suggestions with its open gallery on all screens
- UPDATED decisions/testing-strategy.md — add shared picker browser coverage to urgent external verification
- UPDATED wiki/index.md — surface picker display modes and pending verification
- UPDATED wiki/log.md — record the approved shared picker behavior and verification updates
- UPDATED workflows/main-screen.md — document mobile full-ledger category names alongside readable expense titles
- UPDATED wiki/index.md — surface category labels and correct implemented group Settings/deletion status
- UPDATED wiki/log.md — record the approved mobile category label and status correction
- UPDATED workflows/main-screen.md — describe the mobile group Settings identity and second-row edit action
- UPDATED wiki/index.md — surface the responsive Settings identity layout
- UPDATED wiki/log.md — record the approved mobile Settings card fix
- UPDATED workflows/main-screen.md and wiki/index.md — clarify the mobile expense-row summary and detail distinction
- UPDATED wiki/log.md — record the approved expense-row documentation refinement
- UPDATED workflows/main-screen.md — document readable wrapping mobile ledger and Overview expense titles with amounts below
- UPDATED wiki/index.md — surface the responsive expense-row layout
- UPDATED wiki/log.md — record the approved mobile expense-list layout update
- UPDATED architecture/layout-architecture.md — document category/tag content-only scrolling that prevents rows showing above card headers
- UPDATED wiki/index.md — reflect the mobile card-header scroll boundary
- UPDATED wiki/log.md — record the approved category/tag header-gap correction
- UPDATED architecture/layout-architecture.md — distinguish mobile scrolling category/tag cards from bounded desktop and member routes
- UPDATED workflows/category-management.md and workflows/tag-management.md — document 50vh mobile cards, sticky controls, and second-row actions
- UPDATED workflows/main-screen.md — describe the mobile category/tag page scroll contract
- UPDATED decisions/testing-strategy.md — mark Playwright forbidden in this environment and urgent browser verification pending elsewhere
- UPDATED wiki/index.md — surface mobile category/tag layout and urgent browser verification restriction
- UPDATED wiki/log.md — record the approved responsive layout and verification policy updates
- UPDATED workflows/main-screen.md — document mobile Paid by and Split detail cards stacked without changing desktop columns
- UPDATED wiki/index.md — surface responsive expense detail in main-screen navigation
- UPDATED wiki/log.md — record the approved mobile expense-detail layout
- UPDATED workflows/member-management.md — document mobile one-line member names with data tooltip and full-width second-row actions
- UPDATED workflows/filtering.md — record mobile filtered-only result count and popover placement below the sticky toolbar
- UPDATED workflows/main-screen.md — distinguish mobile and desktop expense result-count visibility
- UPDATED wiki/index.md — surface the mobile member layout and filtered-only count
- UPDATED wiki/log.md — record the approved responsive member and filter UX updates
- UPDATED architecture/layout-architecture.md — distinguish mobile full-page expense scrolling and stacked sticky controls from bounded desktop/group routes
- UPDATED workflows/filtering.md — document mobile full-width search and sticky sort/filter below the title after insights scroll away
- UPDATED workflows/main-screen.md — correct the mobile Expenses scrolling contract
- UPDATED wiki/index.md — surface the mobile expense scroll and toolbar behavior in navigation summaries
- UPDATED wiki/log.md — record the approved mobile expense layout documentation
- UPDATED workflows/main-screen.md — document conditional mobile member count and View all at the six-member preview limit
- UPDATED wiki/index.md — surface the conditional member preview in main-screen navigation
- UPDATED wiki/log.md — record the approved mobile member-preview documentation
- UPDATED architecture/layout-architecture.md — document sticky mobile Back to dashboard link on non-form group routes
- UPDATED workflows/main-screen.md — describe group exit on mobile and existing form/desktop return paths
- UPDATED wiki/index.md — surface the mobile group escape route in navigation summaries
- UPDATED wiki/log.md — record the approved group-navigation documentation
- UPDATED architecture/layout-architecture.md — replace floating mobile New group CTA with centered purple dashboard footer action
- UPDATED workflows/dashboard.md — document mobile Unsettled subtitle and descriptive category-spending destination without desktop changes
- UPDATED wiki/index.md — reflect the revised mobile navigation and dashboard summaries
- UPDATED wiki/log.md — record the approved mobile navigation and copy updates
- UPDATED workflows/dashboard.md — document mobile category subtitle and explicit View all without changing desktop layout or chart links
- UPDATED wiki/index.md — surface mobile category View all in dashboard navigation summary
- UPDATED wiki/log.md — record the approved mobile dashboard header documentation
- UPDATED workflows/dashboard.md — describe category-preview links to Analytics and mobile Back navigation instead of a footer tab
- UPDATED architecture/layout-architecture.md — reflect the four-item dashboard footer and chart entry point
- UPDATED wiki/index.md — keep navigation summaries aligned with the mobile Analytics flow
- UPDATED wiki/log.md — record the approved mobile navigation documentation

## 2026-10-03
- UPDATED architecture/layout-architecture.md — document mobile-only persistent headings on Activity, Unsettled, Analytics, and app Settings
- UPDATED wiki/index.md — surface mobile destination header behavior in layout navigation
- UPDATED wiki/log.md — record the approved mobile layout documentation
- CREATED debugging/mobile-pwa-install.md — record the observed Netlify manifest media type and browser-dependent install flow
- UPDATED wiki/index.md — link the install troubleshooting page and reflect the install dialog
- UPDATED wiki/log.md — record the approved install troubleshooting documentation

## 2026-10-02
- UPDATED workflows/main-screen.md and wiki/index.md — remove stale claim that the insights card displays member contributions
- UPDATED architecture/layout-architecture.md and wiki/index.md — clarify document scroll lock on viewport-bounded group routes
- UPDATED workflows/filtering.md — remove member disclosure, describe distinct banner and scrollable filter popovers
- UPDATED workflows/main-screen.md and architecture/layout-architecture.md — describe Balances Back, sticky group headers, and viewport-bounded list/card scrolling
- UPDATED wiki/index.md — keep navigation descriptions current with the revised group layout
- UPDATED workflows/filtering.md — describe responsive member disclosure and full-group balances action
- UPDATED architecture/layout-architecture.md, workflows/dashboard.md, and workflows/main-screen.md — document desktop group activity except Settings and removed header shortcut
- UPDATED wiki/index.md — reflect activity placement, header navigation, and refined insights
- UPDATED workflows/filtering.md and workflows/main-screen.md — document compact filter-aware insights above the controls and distinguish filtered net from full-group balance
- UPDATED workflows/dashboard.md — record non-profile category artwork in activity rows
- UPDATED wiki/index.md — surface ledger insights and activity icon correction in navigation
- UPDATED wiki/index.md, roadmap/product-roadmap.md, and wiki/log.md — reconcile pulled navigation/roadmap/log with PWA additions and clarify postponed-update activation
- UPDATED roadmap/product-roadmap.md — distinguish mobile-emulated PWA tests from physical-device release verification
- UPDATED wiki/index.md — reflect desktop/mobile-emulated offline checks without claiming physical-device coverage

## 2026-10-01
- UPDATED decisions/iconography.md — record verified, resumable background icon caching and repair without permanent-storage promises
- UPDATED roadmap/product-roadmap.md — distinguish implemented PWA foundation from outstanding update/data-safety release gates
- UPDATED wiki/index.md — reflect PWA implementation status and updated navigation
- UPDATED wiki/index.md — mark export-style group duplication as pending in implementation status
- UPDATED roadmap/product-roadmap.md — add group duplication alongside, not instead of, browser-suite repair as a next task
- UPDATED decisions/import-export.md — distinguish planned export-style local group clone from generated transfer formats
- UPDATED wiki/index.md — surface both next tasks and the planned same-device duplication flow
- UPDATED architecture/layout-architecture.md and workflows/dashboard.md — remove activity tooltip documentation while retaining wrapped panel rows
- UPDATED wiki/index.md — remove activity tooltip claim from layout navigation
- UPDATED architecture/layout-architecture.md and workflows/dashboard.md — explain wrapping activity rows and full-text hover/focus tooltip
- UPDATED wiki/index.md — surface readable desktop activity metadata and tooltip behavior
- UPDATED decisions/iconography.md — document existing 3D PNG illustrations on both route-error states
- UPDATED wiki/index.md — surface route-error imagery in iconography navigation
- UPDATED architecture/layout-architecture.md and wiki/index.md — clarify conditional two/three-pane desktop shell
- UPDATED architecture/layout-architecture.md and workflows/dashboard.md — restrict desktop activity panel to Dashboard and Group Overview while keeping create-group preview; correct recording metadata placement
- UPDATED wiki/index.md — reflect dashboard/overview activity visibility
- UPDATED workflows/main-screen.md — locate quiet recording metadata between detail banner and breakdown cards
- UPDATED wiki/index.md — reflect expense-detail recording metadata placement
- UPDATED architecture/layout-architecture.md — document root-route fallback for missing pages and unexpected errors
- UPDATED wiki/index.md — surface the route-error fallback in layout navigation
- UPDATED decisions/expense-edit-delete.md — document reference-only immediate category/tag changes on expense detail
- UPDATED workflows/tag-management.md — document always-available tag popover and modal creation with automatic attachment
- UPDATED workflows/category-management.md — document active-category detail dropdown and immediate save
- UPDATED workflows/main-screen.md — distinguish occurred and recorded dates, quick edits, and formatted ledger dates
- UPDATED workflows/dashboard.md — document consistent rendered date/time format across dashboard and activity
- UPDATED wiki/index.md — synchronize quick-edit and date-display navigation summaries
- UPDATED workflows/filtering.md — document sectioned eight-mode sorting and exact multi-tag-set grouping
- UPDATED wiki/index.md — surface the expanded sort modes and grouping rule
- UPDATED workflows/filtering.md — document four URL-backed expense sort orders and their filter interaction
- UPDATED wiki/index.md — surface implemented expense sorting in filtering navigation and status

## 2026-09-30
- UPDATED workflows/main-screen.md — document explicit current-time shortcut with required time and selected-date preservation
- UPDATED workflows/dashboard.md — document persistent Settings import access and labelled desktop unsettled navigation
- UPDATED wiki/index.md — reflect expense time shortcut and dashboard navigation updates
- UPDATED architecture/layout-architecture.md — document the persistent main-pane scroll container and root route reset across desktop/mobile and public pages
- UPDATED wiki/index.md — surface route scroll-reset behavior in layout navigation
- UPDATED roadmap/product-roadmap.md — prioritize investigation of 18 expense-filter and import/export browser failures after the 74/92 full-suite run
- UPDATED wiki/index.md — surface the browser-suite repair task in roadmap navigation
- UPDATED workflows/category-management.md — document in-expense category creation, selection, and empty-active-category recovery
- UPDATED wiki/index.md — reflect category creation during expense entry
- UPDATED workflows/member-management.md — document immediate add-person form alongside existing-friend selection
- UPDATED wiki/index.md — reflect one-click member addition in workflow navigation
- UPDATED decisions/iconography.md — document seven-day Netlify browser caching for public emoji PNGs and the unversioned-URL tradeoff
- UPDATED wiki/index.md — include emoji caching in iconography navigation
- UPDATED decisions/iconography.md — explain display-only PNG mapping for saved category emoji without data migration
- UPDATED wiki/index.md — reflect category icon compatibility in iconography navigation
- UPDATED decisions/iconography.md — record image-only scoped picker, persisted asset keys, and no legacy Unicode migration
- UPDATED decisions/iconography.md — describe catalog tracking without a stale hard-coded asset count
- UPDATED architecture/domain-models.md — describe profile and non-profile PNG keys in icon fields
- UPDATED wiki/index.md — reflect PNG icon implementation in navigation
- UPDATED workflows/category-management.md — document stacked category editor matching onboarding and the squeezed-input cause
- UPDATED wiki/index.md — reflect the corrected category editor layout
- UPDATED workflows/main-screen.md — correct ledger description and document visible local 12-hour expense times
- UPDATED wiki/index.md — reflect date/time ledger rows in main-screen navigation
- UPDATED workflows/main-screen.md — document blank time entry with today's date on new expenses
- UPDATED wiki/index.md — reflect the expense time default in navigation

## 2026-09-29
- UPDATED workflows/main-screen.md — document 12-hour expense entry and local timestamp conversion
- UPDATED wiki/index.md — reflect expense time entry in main-screen navigation
- UPDATED architecture/layout-architecture.md — document top-of-page quiet Back controls for import/restore and emphasized restore countdown
- UPDATED wiki/index.md — reflect transfer navigation placement in layout summary
- UPDATED architecture/layout-architecture.md — describe reusable icon-bearing error/warning banners and distinct wrong-file action buttons
- UPDATED workflows/main-screen.md — remove group-settings import entry and clarify app-level import versus group export
- UPDATED wiki/index.md — reflect banner icons and group-only export placement
- UPDATED architecture/layout-architecture.md — document semantic error/warning banners and history-based restore Back; correct implemented Settings theme toggle
- UPDATED wiki/index.md — reflect feedback banner convention and current theme-control status
- UPDATED decisions/full-backup.md and decisions/import-export.md — document expected download names, tamper warnings, and links between the distinct group and app file flows
- UPDATED wiki/index.md — reflect clear file selection and wrong-file navigation in transfer and backup entries
- UPDATED decisions/group-deletion.md — record implemented atomic cascade, shared-contact preservation, and last-group onboarding behavior
- UPDATED decisions/full-backup.md — clarify filename-independent ZIP validation, wrong-file errors, and empty-group recovery
- UPDATED decisions/confirmation-dialogs.md — include group deletion in shared confirmation behavior
- UPDATED architecture/state-management.md and workflows/main-screen.md — describe group deletion action and Group Settings flow
- UPDATED wiki/index.md — reflect implemented group deletion and revised backup/confirmation guidance
- CREATED decisions/full-backup.md — document one versioned local whole-app ZIP and destructive, atomic device restore separately from group transfer
- UPDATED roadmap/product-roadmap.md — include local full-app recovery and defer optional Drive storage
- UPDATED wiki/index.md — link the full-backup decision and show its implementation status
- UPDATED architecture/layout-architecture.md and workflows/dashboard.md — documented recorded-time activity order and dashboard-wide versus group-only right-panel scope; corrected stale dashboard claims
- UPDATED wiki/index.md — refreshed layout and dashboard navigation summaries and corrected stale dashboard-route status
- UPDATED decisions/import-export.md — documented link-only group-owned ID compaction and explicit same-name contact resolution before atomic import
- UPDATED wiki/index.md — reflected compact links and import contact reconciliation in navigation
- UPDATED decisions/import-export.md — clarified that the dependency modal separates chosen content from automatically included content
- UPDATED wiki/index.md — refreshed import/export summary for the visual dependency flow
- UPDATED decisions/import-export.md — documented styled native dependency explanations for auto-selected export content
- UPDATED wiki/index.md — reflected the dependency-modal UX in the import/export summary
- UPDATED decisions/import-export.md and decisions/selection-controls.md — documented size-aware link guidance and visibly locked export choices
- UPDATED workflows/tag-management.md and workflows/main-screen.md — documented expandable tag previews in the ledger and Overview
- UPDATED wiki/index.md — synchronized transfer, controls, expense-list, and tag-management summaries
- CREATED decisions/selection-controls.md — document native-input semantics and shared selection styling
- UPDATED wiki/index.md — linked selection-controls decision
- CREATED decisions/confirmation-dialogs.md — document in-app destructive confirmations and cancellation/failure behavior
- UPDATED workflows/category-management.md — clarify guarded deletion uses the shared confirmation dialog
- UPDATED wiki/index.md — linked the confirmation decision and refreshed category-management summary
- CREATED decisions/iconography.md — define consistent vector interface icons without replacing domain emoji identities
- UPDATED wiki/index.md — added iconography decision to navigation
- UPDATED workflows/people-directory.md and workflows/member-management.md — documented per-group expense links for blocked contact deletion
- UPDATED wiki/index.md — synchronized the people-directory summary
- UPDATED workflows/filtering.md and workflows/member-management.md — documented URL-backed filters and the blocked-member expense shortcut; refreshed page date
- UPDATED wiki/index.md — synchronized filtering and member-management summaries
- UPDATED architecture/layout-architecture.md — documented why compact activity rows avoid the shared Surface CSS cascade
- UPDATED wiki/index.md — aligned the layout summary with the unboxed activity list
- UPDATED architecture/layout-architecture.md — documented the contextual group sidebar and live compact activity panel; corrected stale route/menu claims
- UPDATED wiki/index.md — synchronized the layout architecture description
- UPDATED workflows/main-screen.md — documented the six-member payer-frequency preview and corrected stale tab terminology
- UPDATED wiki/index.md — synchronized the Overview member-preview and navigation summary
- UPDATED workflows/main-screen.md — removed the redundant group-view tabs; documented direct Overview links and existing navigation
- UPDATED wiki/index.md — synchronized the main-screen navigation summary
- UPDATED workflows/main-screen.md — distinguished group overview snapshot, complete expense ledger, and balance navigation
- UPDATED wiki/index.md — synchronized the main-screen summary with the group-view distinction
- UPDATED decisions/import-export.md, decisions/testing-strategy.md, workflows/filtering.md, and workflows/main-screen.md — documented fixed-scale transfers, tests, filters, and Settings relabeling
- UPDATED wiki/index.md — synchronized transfer, test, filtering, and main-screen summaries
- UPDATED architecture/split-types.md, architecture/balance-calculation.md, decisions/expense-model-design.md, decisions/expense-edit-delete.md, and systems/indexeddb-schema.md — aligned allocations, balances, adjustments, and persisted rows with fixed hundredths
- UPDATED wiki/index.md — synchronized accounting and schema page summaries and monetary invariants
- UPDATED decisions/money-representation-and-rounding.md and architecture/domain-models.md — marked fixed-hundredths money and confirmed no-conversion currency relabeling implemented
- UPDATED wiki/index.md — synchronized monetary representation and group currency semantics
- UPDATED decisions/money-representation-and-rounding.md — removed the hypothetical migration requirement after confirmation that the undeployed local database and transfer data are empty
- UPDATED wiki/index.md — reflected the approved no-migration scope of the pending redesign
- UPDATED decisions/money-representation-and-rounding.md — recorded the approved pending fixed-hundredths, no-exchange currency-label redesign while retaining current-code behavior
- UPDATED wiki/index.md — distinguished the pending money redesign from the current implementation

## 2026-09-27
- REMOVED workflows/design-artifact.md — retired obsolete standalone visual-reference instructions after implementation
- UPDATED wiki/index.md — removed the retired workflow from navigation
- UPDATED workflows/development-tools.md — documented unique preset-based contacts in the Onboard user fixture while retaining its fixed local user and other fixture records
- UPDATED wiki/index.md — synchronized the development-tools summary

## 2026-09-26
- UPDATED decisions/import-export.md and wiki/index.md — documented source receipt-reference validation so omission counts cannot hide missing or surplus files
- UPDATED decisions/expense-edit-delete.md and ideas/itemized-split.md — removed stale view-only import and pending receipt-transfer cross-references
- UPDATED wiki/index.md — synchronized the corrected edit/delete and itemized-split summaries
- UPDATED decisions/import-export.md — replaced the temporary read-only sharing design with the implemented selective, integrity-checked, fresh-ID editable group-transfer contract
- UPDATED decisions/onboarding-persistence.md and workflows/onboarding.md — documented the atomic fresh-device import identity and completion path
- UPDATED architecture/state-management.md — documented complete import transaction, ID remapping, count verification, and post-commit rehydration
- UPDATED workflows/main-screen.md and workflows/dashboard.md — documented the transfer questionnaire, format dependencies, and welcome/dashboard import entry points
- UPDATED decisions/testing-strategy.md — recorded transfer-size, integrity, dependency, rollback, and desktop/mobile Link/CSV/ZIP coverage
- UPDATED roadmap/product-roadmap.md — marked editable group transfer implemented and separated future settlement Link/PDF/Excel sharing
- UPDATED wiki/index.md — synchronized transfer status, navigation summaries, and import invariant

## 2026-09-25
- UPDATED decisions/import-export.md — finalized and documented the version-1 Link, typed-row CSV, ZIP manifest, URL/decoded-size ceilings, attachment boundaries, and current import split
- UPDATED workflows/main-screen.md and roadmap/product-roadmap.md — marked all three export formats and anonymous Link viewing implemented while retaining pending file/editable import
- UPDATED decisions/testing-strategy.md — recorded export validation, round-trip, archive, download, and desktop/mobile anonymous-view coverage
- UPDATED wiki/index.md — marked export done and synchronized import/export and main-screen navigation summaries
- UPDATED workflows/filtering.md and workflows/main-screen.md — documented automatic stale-option pruning and direct desktop/mobile filter coverage
- UPDATED roadmap/product-roadmap.md and decisions/testing-strategy.md — marked the filtering gaps resolved and recorded the new unit/browser cases
- UPDATED wiki/index.md — marked expense list and filtering done and synchronized navigation summaries
- UPDATED workflows/filtering.md — documented implemented eight-field matching, validation, memory-only scope, utility coverage, and stale deleted-option limitation
- UPDATED workflows/main-screen.md and roadmap/product-roadmap.md — marked expense filtering implemented while retaining remaining history refinements and direct UI coverage
- UPDATED decisions/testing-strategy.md — recorded expense-filter utility coverage and the pending direct interaction suite
- UPDATED wiki/index.md — synchronized filtering navigation and implementation status while retaining the in-progress classification

## 2026-09-23
- UPDATED architecture/domain-models.md, architecture/split-types.md, and decisions/expense-model-design.md — documented exact decimal ratio metadata, integer adjustments, and numeric legacy read compatibility
- UPDATED decisions/money-representation-and-rounding.md and decisions/expense-edit-delete.md — documented the ratio precision fix and the inability to recover already-rounded legacy inputs automatically
- UPDATED systems/indexeddb-schema.md — aligned ratio metadata representation and corrected stale tag-cleanup documentation to persisted transactional reads
- UPDATED decisions/testing-strategy.md — recorded boundary, round-trip, legacy, persistence, and browser ratio regression coverage
- UPDATED wiki/index.md — marked both reviewed defects resolved for current writes and retained the legacy precision limitation
- UPDATED workflows/tag-management.md — documented persisted-reference cleanup, rollback, and group expense refresh; retained the resolved resurrection bug's cause
- UPDATED architecture/state-management.md and architecture/domain-models.md — aligned tag deletion guarantees with transactional persisted reads and reference-only updates
- UPDATED decisions/expense-edit-delete.md — marked tag resurrection resolved while retaining the shares precision limitation
- UPDATED decisions/testing-strategy.md — recorded tag-cleanup stale-state, overlapping-mutation, and rollback regression coverage
- UPDATED decisions/money-representation-and-rounding.md — corrected stale creation-only claims to include implemented expense updates and old-total replacement
- UPDATED wiki/index.md — synchronized tag cleanup guarantees and the remaining review finding

## 2026-09-22
- UPDATED workflows/tag-management.md — documented the confirmed deleted-expense resurrection caused by stale full-record tag cleanup and its receipt/ranking consequences
- UPDATED decisions/expense-edit-delete.md — documented the accepted shares boundary that fails on editing and qualified deletion guarantees across tag mutations
- UPDATED wiki/index.md — surfaced both unresolved review findings in navigation, implementation status, and the tag-cleanup invariant

## 2026-09-20
- UPDATED decisions/expense-edit-delete.md and decisions/expense-model-design.md — documented implemented detail/edit/delete, preserved metadata, inactive-category retention, and atomic receipt cleanup
- UPDATED architecture/balance-calculation.md and decisions/solo-group-support.md — documented exact all-member balances, deterministic transfer suggestions, and solo balance copy
- UPDATED architecture/domain-models.md, architecture/state-management.md, and systems/indexeddb-schema.md — aligned create/update/delete validation, aggregate replacement checks, payer ranking, and attachment transaction boundaries
- UPDATED workflows/main-screen.md, architecture/layout-architecture.md, workflows/filtering.md, and workflows/paid-by.md — documented detail/edit/balances routes, list navigation, and ranking after corrections/deletion
- UPDATED workflows/member-management.md and workflows/people-directory.md — documented persisted member reference checks and self-deletion protection while retaining remaining cascade limits
- UPDATED decisions/testing-strategy.md — recorded edit round-trip, mutation rollback/cascade, member-guard, balance, and browser workflow coverage
- UPDATED roadmap/product-roadmap.md and wiki/index.md — marked the core accounting implementation complete while retaining later release requirements

## 2026-09-19
- CREATED workflows/development-tools.md — documented approved random preset helpers, individual creation actions, naming rules, and persistence boundaries
- UPDATED wiki/index.md — linked the development-tools workflow
- UPDATED systems/indexeddb-schema.md, decisions/expense-model-design.md, and decisions/expense-edit-delete.md — reconciled implemented expense creation, monetary validation, category selection, and index usage with pending editing, category settings, and attachments
- UPDATED workflows/onboarding.md, workflows/main-screen.md, architecture/layout-architecture.md, architecture/split-types.md, and decisions/solo-group-support.md — corrected membership guards, group-switch reset, theme controls, split presentation, and solo-flow status
- UPDATED architecture/domain-models.md, workflows/tag-management.md, and architecture/state-management.md — distinguished future display/loading behavior and documented hydrated-state validation and cascade limits
- UPDATED decisions/string-input-normalization.md and decisions/testing-strategy.md — documented optional expense blanks, installed browser suites, test-only fake IndexedDB, and remaining coverage gaps
- UPDATED ideas/itemized-split.md and roadmap/product-roadmap.md — removed obsolete delivery commitments and aligned implemented defaults and unresolved settlement design
- UPDATED wiki/index.md — synchronized navigation summaries and tag-cascade invariant with the approved wiki audit
- UPDATED workflows/member-management.md and architecture/domain-models.md — documented transactional duplicate membership protection and repeated-add controls
- UPDATED decisions/money-representation-and-rounding.md and architecture/state-management.md — documented atomic aggregate-limit validation to keep group spending and member balances within safe-integer bounds
- UPDATED wiki/index.md — aligned membership and money summaries with the approved review fixes
- UPDATED workflows/main-screen.md, workflows/paid-by.md, workflows/category-management.md, workflows/tag-management.md, and workflows/filtering.md — documented expense recording, selection rules, saved rows, and remaining editing/filtering work
- UPDATED architecture/domain-models.md, architecture/state-management.md, architecture/split-types.md, architecture/balance-calculation.md, and systems/indexeddb-schema.md — documented enforced creation invariants, integer allocations, persisted-reference validation, and atomic expense/ranking saves
- UPDATED decisions/money-representation-and-rounding.md and decisions/testing-strategy.md — recorded implemented monetary boundaries and unit/persistence/browser coverage
- UPDATED roadmap/product-roadmap.md and wiki/index.md — marked expense recording, five split methods, and paid-by implemented while retaining pending edit/delete and receipt scope
- UPDATED workflows/member-management.md — reconciled stashed member-management implementation with the upstream audit, retaining remaining validation gaps and planned expense recovery
- UPDATED wiki/index.md — preserved upstream roadmap and testing entries while aligning member-management status and guards with merged source
- UPDATED wiki/log.md — resolved the stash conflict, preserving both documentation histories and upstream's normalized wiki-only log

## 2026-08-26
- CREATED decisions/testing-strategy.md — selected Vitest for unit and integration tests and reserved Playwright for critical end-to-end browser workflows
- CREATED decisions/string-input-normalization.md — required trimming and nonempty validation for every submitted user string at form and store boundaries
- UPDATED decisions/testing-strategy.md — defined mirrored test directories, authoring rules, case-selection checklist, slice completion criteria, and behavior-based coverage expectations
- UPDATED wiki/index.md — linked the testing strategy and marked automated tests in progress after adding balance-helper coverage
- UPDATED wiki/index.md — linked the string-input normalization decision
- UPDATED wiki/index.md — expanded the testing-strategy summary after adopting the test-directory and authoring protocol
- UPDATED wiki/log.md — recorded the testing-strategy decision

## 2026-08-20
- CREATED roadmap/product-roadmap.md — compiled the historical master scope into a status-labelled product compass, staged delivery horizons, release gates, non-goals, and exploration list
- CREATED decisions/money-representation-and-rounding.md — approved currency-aware integer minor units and deterministic largest-remainder split allocation before expense entry implementation
- UPDATED architecture/domain-models.md, architecture/split-types.md, and systems/indexeddb-schema.md — documented the approved monetary target while preserving the current unimplemented enforcement boundary
- UPDATED decisions/import-export.md — defined the complete portable dataset, ID/versioning requirements, validation boundary, and remaining serialization/dependency-conflict work
- UPDATED wiki/index.md — added the roadmap and money decision to navigation and recorded the monetary target invariant
- UPDATED wiki/log.md — recorded the master-scope ingestion
- UPDATED wiki/index.md — clarified source authority, corrected research coverage, and distinguished target invariants from store-enforced behavior
- UPDATED architecture/domain-models.md, architecture/state-management.md, architecture/layout-architecture.md, and architecture/split-types.md — reconciled implementation boundaries, routing, validation, and the unresolved rounding policy
- UPDATED decisions/expense-model-design.md, decisions/expense-edit-delete.md, decisions/import-export.md, and decisions/solo-group-support.md — marked unimplemented behavior explicitly and corrected the solo-helper claim
- UPDATED workflows/onboarding.md, workflows/category-management.md, and workflows/member-management.md — corrected navigation/resume behavior and UI-versus-store enforcement gaps
- UPDATED research/competitive-landscape.md, research/market-opportunity.md, research/monetization-model.md, and research/user-pain-points.md — repaired source paths, added dated-snapshot status, refreshed volatile facts, and reduced roadmap ambiguity
- UPDATED wiki/log.md — normalized date headings, removed source-code-only history, and recorded this audit reconciliation
- UPDATED wiki/index.md — removed the development-migration blocker, marked IndexedDB/Zustand DONE, and distinguished implemented, partial, and planned workflows
- UPDATED systems/indexeddb-schema.md — documented the active-development reset-on-schema-change lifecycle and removed legacy migration/backfill warnings
- UPDATED architecture/state-management.md and workflows/group-creation.md — distinguished atomic tag deletion from sequential composed writes and final-submit group creation
- UPDATED workflows/onboarding.md and decisions/onboarding-persistence.md — corrected the `/dashboard` destination, final-step completion semantics, missing-row behavior, and planned import entry points
- UPDATED architecture/split-types.md, workflows/paid-by.md, and workflows/filtering.md — labelled modelled designs and all unimplemented UI/calculation/filter behavior as planned
- UPDATED workflows/member-management.md and workflows/category-management.md — separated implemented store/CRUD guards from missing management UI and recorded category deactivation as future historical-reference protection
- UPDATED wiki/log.md — recorded the reconciliation and normalized all dated sections into reverse chronological order

## 2026-08-17
- UPDATED workflows/member-management.md — documented the implemented group-details member add, edit, confirmed removal, duplicate guard, and expense-reference validation
- UPDATED wiki/index.md — marked member management done

## 2026-08-16
- UPDATED architecture/balance-calculation.md, architecture/layout-architecture.md, workflows/dashboard.md, and workflows/main-screen.md — documented the implemented overview and balance behavior
- UPDATED wiki/index.md — marked Group overview DONE and refreshed the balance-calculation summary

- UPDATED architecture/domain-models.md and architecture/state-management.md — combined the newer tag/category implementation with valid local frequent-payer, people, onboarding, draft, and Dexie corrections
- UPDATED architecture/balance-calculation.md and architecture/layout-architecture.md — aligned current balance and responsive-route claims with committed source while retaining target designs
- UPDATED systems/indexeddb-schema.md — retained the implemented tags schema and documented the unresolved Dexie version-1 migration risk and unimplemented expense/attachment mutations
- UPDATED workflows/group-creation.md and workflows/people-directory.md — preserved final-submit timing and self-person safety clarifications from the local history
- UPDATED workflows/dashboard.md and workflows/main-screen.md — reconciled the older standalone-overview notes with the newer nested group-detail routes and lightweight screens
- UPDATED wiki/index.md — reconciled implementation statuses and navigation summaries against current source
- UPDATED wiki/log.md — preserved both chronological histories and recorded their semantic reconciliation

## 2026-08-12
- UPDATED decisions/group-deletion.md — clarified that permanent group deletion and its full cascade are approved but not yet implemented
- UPDATED wiki/index.md — marked group deletion as an approved pending design
- UPDATED workflows/main-screen.md — recorded the low-priority direct-URL group-switch editor-state edge case
- UPDATED decisions/group-deletion.md — added group-scoped tags to the deletion cascade and warning
- UPDATED architecture/state-management.md — corrected tag actions to async and documented the implemented Dexie-first persistence strategy
- UPDATED wiki/index.md — refreshed summaries for state management, group deletion, and main-screen TODOs
- UPDATED workflows/tag-management.md — documented the reusable 10-preset color picker with synchronized custom and hex inputs
- UPDATED wiki/index.md — added the preset/custom hex picker to the tag-management summary
- UPDATED architecture/domain-models.md — added required color to the Tag model
- UPDATED architecture/state-management.md — added color to tag creation and update actions
- UPDATED systems/indexeddb-schema.md — documented the required tag color field
- UPDATED workflows/tag-management.md — tag creation and editing now require a visual color
- UPDATED wiki/index.md — described tags as named and colored group records
- UPDATED workflows/category-management.md — category deletion now checks in-use and last-category guards before showing irreversible-action confirmation
- UPDATED wiki/index.md — noted guarded and confirmed category deletion
- UPDATED architecture/domain-models.md — restored durable group-scoped Tag records and optional Expense.tagIds references
- UPDATED architecture/state-management.md — documented the tags slice and group-tag actions
- UPDATED systems/indexeddb-schema.md — restored the group-indexed tags table and atomic expense-reference cleanup
- UPDATED workflows/category-management.md — documented normalized, case-insensitively unique group category names
- UPDATED workflows/tag-management.md — corrected tags to group-scoped records with optional expense references and atomic deletion
- UPDATED workflows/filtering.md — changed tag filtering back to group tag IDs
- UPDATED workflows/main-screen.md — recorded the add-expense form as the next TODO behind the existing CTA
- UPDATED wiki/index.md — corrected tag invariants and refreshed state-management and main-screen summaries

## 2026-08-11
- UPDATED workflows/category-management.md — category delete is blocked for in-use categories and the last category in a group
- UPDATED workflows/tag-management.md — deleting a group tag label removes it from matching expense `tags` arrays
- UPDATED wiki/index.md — updated category and tag invariants for delete semantics
- UPDATED architecture/domain-models.md — removed permanent Tag model and changed Expense from `tagIds[]` to expense-local `tags[]`
- UPDATED systems/indexeddb-schema.md — removed tags table and documented tags as nested expense labels
- UPDATED workflows/tag-management.md — rewrote tag behaviour as optional non-permanent expense-local labels
- UPDATED workflows/category-management.md — noted Categories & Tags screen separates durable category management from expense-local tags
- UPDATED workflows/filtering.md — tag filtering now operates on `Expense.tags` labels
- UPDATED wiki/index.md — updated tag workflow description and tag invariant
- UPDATED wiki/index.md — marked Category management IN PROGRESS after adding group category controls

## 2026-08-10
- UPDATED architecture/layout-architecture.md — sidebar now shows back-to-dashboard plus active group summary instead of the full groups list inside group routes
- UPDATED workflows/main-screen.md — changed group route status from missing to lightweight routed screens
- UPDATED wiki/index.md — marked group detail routes DONE while feature workflows remain pending
- UPDATED workflows/main-screen.md — documented that dashboard/nav links reference group detail routes that are not implemented yet
- UPDATED wiki/index.md — reflected pending group detail routes in navigation description and implementation status

## 2026-07-13
- UPDATED wiki/index.md — reconciled the status table with current source; added group overview, tags, attachments, group deletion, PWA, and test coverage; marked routing and persistence in progress
- UPDATED systems/indexeddb-schema.md — separated current tables from planned tags/attachment behavior; documented the unchanged Dexie version-1 migration and legacy self-person/member backfill risk
- UPDATED architecture/layout-architecture.md — corrected viewport rendering, missing routes, tablet activity behavior, and hardcoded desktop activity
- UPDATED architecture/balance-calculation.md — recorded the current member-net/group-total helpers and marked all-member debt simplification as pending
- UPDATED workflows/dashboard.md — separated the basic implemented group list from planned summaries, analytics, unsettled balances, and real activity

- UPDATED workflows/main-screen.md — documented current dashboard-to-overview navigation, group overview contents, sidebar balances, and missing routes; relabeled expense/balance views and group menu as target design
- UPDATED wiki/index.md — refreshed the Main Screen description to distinguish current navigation from planned in-group behavior

## 2026-06-27
- UPDATED architecture/domain-models.md and systems/indexeddb-schema.md — corrected `frequentPayerIds` initial value to current implementation (`[creatorMemberId]`)
- UPDATED architecture/state-management.md — Dexie is now the actual IndexedDB wrapper; member/person action signatures aligned with sliced store types
- UPDATED workflows/group-creation.md and workflows/people-directory.md — clarified create-on-finish timing for member links and inline people
- UPDATED wiki/index.md — marked People directory DONE to match `/friends` implementation

## 2026-06-25
- UPDATED architecture/state-management.md — documented the single Zustand store as domain slices under `src/shared/configs/store/` with one public `useStore`
- UPDATED wiki/index.md — refreshed the State Management description for the sliced store implementation

## 2026-06-12
- CREATED decisions/global-people-directory.md — people are a global device-local directory; members link to shared people; supersedes group-scoped-members; old model + fully-global kept as rejected alternatives
- REMOVED decisions/group-scoped-members.md — superseded by global-people-directory
- CREATED workflows/people-directory.md — friends list management, pick-at-creation, edit propagation, two delete scopes
- UPDATED architecture/domain-models.md — added Person; Member is now a group↔person link (no own name/icon); LocalUser mirrored as a Person
- UPDATED systems/indexeddb-schema.md — added `people` table; `members` now {id, groupId, personId} with personId index; access patterns
- UPDATED workflows/member-management.md — members link to people; edit via person propagates; two removal scopes (per-group link vs directory-wide)
- UPDATED decisions/import-export.md — export snapshots referenced people; import reconciles against local directory
- UPDATED wiki/index.md — decision link renamed; people-directory added to Workflows; invariants #2 & #6 reworded; People directory row IN PROGRESS

## 2026-06-11
- UPDATED architecture/state-management.md — added "Ephemeral State (in store, not persisted)" section documenting the memory-only group draft: per-keystroke mirror of the create/edit group form, seeded on mount and cleared on unmount, synchronous setters with no IndexedDB write; powers the activity-panel live preview; member list excludes creator (reintroduced from localUser); contrasted with onboarding-persistence
- UPDATED wiki/index.md — extended state-management description to mention ephemeral group draft

## 2026-06-10
- UPDATED architecture/domain-models.md — Category gains an emoji `icon` field; noted master presets ship with icons, custom categories get a user-picked one
- UPDATED systems/indexeddb-schema.md — `categories` table gains `icon`; settings `"categories"` row `master` is now `{ name, icon }[]`, `default` clarified as names resolving icons from master
- UPDATED workflows/category-management.md — every category carries an icon; master entries have preset icons; custom-add is an emoji + name editor (shared with onboarding)
- UPDATED ideas/category-settings-ui.md — master shape is now `{ name, icon }[]`

- UPDATED workflows/onboarding.md — steps now save on each "Save and Proceed" (commit-on-button, not live per-toggle); categories step now mandatory (≥1); members optional with no Skip button; added category-mandatory invariant
- UPDATED decisions/onboarding-persistence.md — step→save mapping updated to commit-on-button (categories diffed on Save and Proceed; members added only on final Save and Finish); Next→Save and Proceed terminology; removed stale "saves are live / Skip keeps data" note
- UPDATED workflows/category-management.md — master list is now DB-backed (settings "categories" row, seeded from constant); category selection at creation is mandatory (≥1), defaults pre-selected; persisted on Save and Proceed
- UPDATED decisions/solo-group-support.md — members step has no Skip button; "Save and Finish" without adding yields a solo group; updated helper text
- UPDATED wiki/index.md — category-management description (DB-backed, ≥1 mandatory); added invariant #10 (group requires ≥1 category at creation)

- UPDATED systems/indexeddb-schema.md — replaced the `onboarding` table with a typed, discriminated-union `settings` store (rows keyed by fixed id: `"onboarding"` progress, `"categories"` config); documented seed-from-constants then DB-authoritative
- UPDATED decisions/onboarding-persistence.md — onboarding progress now lives as the `"onboarding"` row in the shared `settings` store (key `'onboarding'`), not a dedicated `onboarding` table at key `'current'`; save mechanics unchanged
- UPDATED ideas/category-settings-ui.md — data layer now built (master/default lists are the `"categories"` settings row, seeded from `SEED_*` constants); aligned field names to reality; settings UI + persist action still TODO
- UPDATED wiki/index.md — schema description now notes the `settings` store; updated category-settings-ui status to "data layer built"

- CREATED workflows/group-creation.md — standalone post-onboarding group creation; 4 steps (no identity), create-on-finish vs onboarding's per-step persistence; create-group domain owns the shared step components, onboarding composes on top
- UPDATED wiki/index.md — added group-creation to Workflows; Group creation flow IN PROGRESS → DONE

- UPDATED wiki/index.md — corrected Implementation Status to match source: IndexedDB+store and onboarding (5 steps, not 7) now DONE; old "Groups list DONE" was stale (page deleted) — home is now the dashboard stub, marked IN PROGRESS; group creation flow moved PENDING → IN PROGRESS (work starting on standalone /groups/new)

## 2026-06-09
- CREATED ideas/category-settings-ui.md — TODO note for settings UI to configure defaultVisibleCategories and defaultSelectedCategories; data layer plan captured
- UPDATED wiki/index.md — added category-settings-ui to Ideas section

## 2026-06-05
- UPDATED architecture/layout-architecture.md — added exact breakpoints (768px/1080px), full sidebar structure, group item component anatomy, context-aware menu items per route
- CREATED workflows/dashboard.md — dashboard sections (overall summary, per-group cards, unsettled balances, category chart, activity), empty states, navigation, multi-currency edge case
- UPDATED wiki/index.md — added dashboard entry to Workflows section
- UPDATED architecture/layout-architecture.md — expanded mobile section: top bar (greeting + light/dark toggle), context-aware bottom nav (home set vs in-group set), no FAB rationale, no features dropped principle
- UPDATED workflows/dashboard.md — added mobile content mapping table showing how each dashboard section maps to a bottom nav tab
- UPDATED architecture/layout-architecture.md — removed persistent top bar concept; greeting is dashboard page content only, not chrome
- UPDATED workflows/dashboard.md — greeting is page content on dashboard only (mobile + desktop); light/dark toggle moved to Settings only
- UPDATED architecture/layout-architecture.md — tablet activity section has explicit "Activity" heading; mobile has no persistent top bar (explicit); cross-reference to dashboard for greeting/toggle details
- UPDATED workflows/dashboard.md — activity item documented as two-line two-column component; unsettled balance entry format documented (group name first, then direction + amount)

## 2026-06-03
- CREATED architecture/layout-architecture.md — two-mode layout system (mobile vs desktop); useViewport hook; AppFooter route-aware design; AppSidebar and ActivityPanel (future)
- UPDATED wiki/index.md — added layout-architecture entry; Groups list status PENDING → DONE

- UPDATED wiki/index.md — revised invariant #4: categories are deletable when unreferenced (reassign-first), no longer "never deleted"
- UPDATED workflows/category-management.md — Category Rules now allow guarded delete (unreferenced only; reassign all expenses first otherwise); added delete-vs-deactivate guidance
- UPDATED architecture/domain-models.md — category guarded-delete rule; clarified tag-vs-category deletion contrast (tags delete freely with cascade; categories only when unreferenced)
- UPDATED workflows/tag-management.md — updated tag-vs-category deletion contrast and Related note to match guarded category delete
- CREATED decisions/onboarding-persistence.md — per-step save + resumable onboarding: dedicated single-row `onboarding` store, monotonic `lastCompletedStep`, viewed step is Zustand-only, completion gated by explicit flag (not `localUser` presence)
- UPDATED workflows/onboarding.md — added Persistence & Resume section; linked onboarding-persistence
- UPDATED systems/indexeddb-schema.md — added `onboarding` single-row store (fixed key `'current'`)
- UPDATED wiki/index.md — added onboarding-persistence to Decisions; marked "IndexedDB layer + Zustand store" and "Onboarding flow" IN PROGRESS

## 2026-05-21
- CREATED workflows/tag-management.md — tag creation (inline + manage screen), rename, atomic delete with cascade, contrast with category no-delete rule
- UPDATED architecture/domain-models.md — added Tag model; added tagIds[] to Expense; added tag-management to Related section
- UPDATED systems/indexeddb-schema.md — added tags table (id, groupId, name); added tagIds field to expenses table; updated access pattern summary
- UPDATED workflows/filtering.md — added Tags multi-select as 8th filterable field; updated field count in overview
- UPDATED wiki/index.md — added tag-management to Workflows; updated filtering description to 8 fields; added invariant #9 (atomic tag deletion)

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

- UPDATED systems/indexeddb-schema.md — expenses table now includes when, splitType, splitMeta, attachmentIds; categoryId marked mandatory
- UPDATED architecture/domain-models.md — removed stale "auto-created categories" note; added master list selection model; categoryId mandatory on expense; icons documented as emoji; deactivated categories stay visible on history
- UPDATED architecture/state-management.md — updated Zustand store shape with all new fields and full action signatures
- UPDATED workflows/main-screen.md — expense list sorted by `when` descending; date shown is `when` not `createdAt`
- UPDATED workflows/member-management.md — added frequentPayerIds cleanup on member removal
- CREATED decisions/group-deletion.md — permanent deletion cascades all group data; irreversible warning
- UPDATED wiki/index.md — added group-deletion to Decisions section
- UPDATED architecture/domain-models.md — added currency field to Group (ISO 4217, defaults to INR, set at group creation)
- UPDATED systems/indexeddb-schema.md — added currency field to groups table
- UPDATED workflows/onboarding.md — added currency selection as step 4 (INR default, pre-filled); renumbered steps to 7 total
- CREATED workflows/filtering.md — 7 filterable expense fields, AND logic, non-persisted filter state
- UPDATED wiki/index.md — added filtering to Workflows section

- UPDATED wiki/index.md — removed stale spec reference from header; corrected competitor count to 7; expanded implementation status to reflect full scope; added invariants 7 and 8
- UPDATED architecture/domain-models.md — corrected last-updated date to 2026-05-18
- UPDATED architecture/state-management.md — corrected last-updated date; fixed createGroup signature to include currency param; removed stale spec reference in Dexie.js note
- UPDATED decisions/solo-group-support.md — replaced restated onboarding steps (which were outdated) with a reference to [[onboarding]]
- UPDATED workflows/category-management.md — corrected group creation description to include currency step before category selection

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

- UPDATED research/monetization-model.md — removed "Custom categories" from Pro features; categories are a free MVP feature (analytics + filtering tool, not a paid gating point)
- CREATED decisions/solo-group-support.md — solo groups (1 member) are valid; add-members onboarding step is skippable with an explanatory prompt; no minimum member count
- UPDATED wiki/index.md — added solo-group-support to Decisions section
- UPDATED architecture/state-management.md — noted that createGroup also auto-creates a Member record for LocalUser
- UPDATED wiki/index.md — added invariant #6: group creator is always auto-added as a Member and cannot be added again manually
- CREATED ideas/rewarded-ads.md — captured optional monetization idea (not committed); user watches ad → earns credits → unlocks Pro
- UPDATED wiki/index.md — added Ideas section for features that are captured but not committed to
