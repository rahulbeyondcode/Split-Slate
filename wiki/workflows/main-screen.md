---
name: main-screen
description: Current dashboard-to-group navigation, expense correction, and balance views
metadata:
  type: workflows
---

# Main Screen

Purpose: describe implemented group navigation, expense workflows, balances, and group transfer.

Last updated: 2026-10-02

## Current Implementation

### Home (Dashboard)

After onboarding, the app lands on `/dashboard`. The dashboard lists every group from the Zustand
store and links each row to `/groups/:groupId`. It does not auto-open a group. The dashboard currently
uses store order; it has no `lastActiveAt` field or recent-activity sort. The desktop/tablet sidebar
also lists groups and currently sorts them by `createdAt` descending.

### Group Detail Routes

`/groups/:groupId` is an implemented parent route with nested routes for Overview, Expenses,
Add Expense, Expense Detail/Edit, Balances, Members, Categories & Tags, and Settings. The parent resolves the active group's
members, people, categories, tags, and expenses and supplies them to child screens through the
router outlet context. An unknown group shows a not-found state with a return link to the dashboard.

The current child screens are:

- **Overview** — the group's snapshot: local net position, group total in the header, up to six
  members ranked by the number of expenses they paid for, suggested-transfer count, and a preview
  of the three most recent expenses with links to the full members, balances, and expenses views
- **Expenses** — the complete searchable, filterable ledger sorted by `when` descending, showing
  name, total paid, payer names, date/time, and category; compact filter-aware insights show
  matched spending without a member breakdown or the large local-balance hero
- **Add Expense** — `/groups/:groupId/expenses/new`, with validated local recording and five split methods
- **Expense Detail/Edit** — payer/split breakdown and tags, prefilled editing, and confirmed hard deletion
- **Balances** — every member's net position and deterministic suggested payments
- **Members** — add existing/new people, edit linked names/icons, and confirmed guarded removal
- **Categories & Tags** — add, edit, and guarded-delete controls for both record types
- **Settings** — editable group name/icon and currency, selective Link/CSV/ZIP export, and confirmed permanent group deletion; no import action

The group's default route opens Overview. Its "View all expenses" and "View all balances" links open
the full ledger and per-member balances respectively; Expenses is also available through the sidebar
and mobile navigation. There is no additional group-view tab bar. The large local-balance hero appears
only on Overview.

The Balances screen has a Back control that returns to the originating group screen, including its
filter URL; direct entry without in-app history falls back to the group's Expenses screen. Group
headers stay visible while scrolling. Expenses, Members, and Categories & Tags fit within the
available viewport, with the expense/member lists and category/tag cards scrolling individually
only when needed. See [[layout-architecture]] and [[filtering]].

On desktop, the activity panel follows group routes except Settings, including expense forms;
the group header no longer has a redundant three-dot shortcut to Settings. The group sidebar
and mobile footer retain Settings navigation. See [[layout-architecture]].

The Overview member preview counts each expense once per member with a positive paid contribution,
even when multiple members pay for the same expense. Higher counts appear first; equal counts and
members with no payments are ordered alphabetically by name. Only six members are shown; the Members
route still lists the entire group.

Changing currency when expenses exist requires confirmation: saved amounts retain their numeric
values and are displayed under the new currency label without exchange conversion. The same
integer hundredths are used for every group currency. See [[money-representation-and-rounding]].

The group header's Add Expense link opens the entry form. Successful saves return to the expense
list and update overview/sidebar balances through the shared store. Failed saves retain form inputs
and show an error; cancellation writes nothing. Submissions are guarded against repeated clicks.
Dashboard and sidebar group rows link to the Overview. The sidebar group-list items display the
local member's calculated net position derived from paid and owed transactions.

The group outlet is keyed by `group.id`. Changing the active group remounts child screens and
resets their form/editor state, including category and tag editors.

---

## In-Group Experience — Current and Planned

The following sections distinguish the existing expense list and entry form from the remaining
target experience. Delivery priorities live in [[product-roadmap]].

### Expense and Balance Views

Overview is the default route. Expenses shows the chronological list of all group expenses; Balances
shows net positions and suggested payments. Neither view uses an in-page tab bar.

- Balances is **read-only in MVP** — shows who owes whom and how much, nothing else
- No settlement action, no mark-as-settled, no notifications in MVP
- **Settlement design is unresolved:** an earlier V2 proposal paired a binary fully-settled toggle
  with push notifications. The roadmap requires a separate decision comparing that model with
  explicit repayment records, including partial repayment, before implementation.
- The Balances view has no suggested transfers for a solo group (net = 0 with one member) and
  explains its personal-spending purpose. Suggested payments do not record repayments.

### Current Expense List

- Expense name
- Total amount
- Paid by (member name)
- Local date and 12-hour time (`when` — the actual expense time, not `createdAt`)

Expenses are sorted by `when` descending. Rows show the local date as `12-Jan-2026` and local
12-hour time as `03:45 PM` beneath the
amount, plus payer names and the category icon beside the name. Names link to detail, which offers
editing, quick category/tag changes, and confirmed deletion. Detail distinguishes the occurred
date/time (separate Date and Time lines in the banner) from the recording date (`createdAt`) shown
as a quiet "Recorded by [name] · [date]" line between the banner and the Paid by/Split cards. Its
tags span a full-width banner row.
The full ledger and recent Overview entries show up to three colored tags and reveal further tags
with a separate Show more control. The list now has real-time name, date, category, tag,
payer, involved-member, split-type, and amount filters with an active count and clear action.
The compact Expense insights card shows matching count, total, rounded average, and top category;
it does not show member contributions or settlement balances. The group header retains the
full-group total, and a separate link opens full-group Balances. Invalid filters suppress the summary.
Unavailable selected option IDs are pruned when the list remounts, and desktop/mobile browser
journeys cover the controls; see [[filtering]].

### Expense Recording

- **Add Expense** button — always visible and prominent
- The form defaults to today's local date with blank hour/minute placeholders, the first active
  category, one payer, and an equal split among all group members. Time must be entered before
  saving. Participants can be deselected; solo groups are supported.
- Date and time entry uses a styled date field and 12-hour hour/minute controls with explicit AM/PM.
  The form still submits a local `YYYY-MM-DDTHH:mm` value in 24-hour notation for validation and
  storage; 12 AM maps to 00:xx, and 12 PM maps to 12:xx. Editing reconstructs the 12-hour display
  from the saved local time without changing an untouched timestamp.
- **Use current time** fills the hour, minute, and AM/PM from the device clock when clicked without
  changing the selected expense date. Manual entry remains available and time remains required;
  omitting it does not silently assign the save time, which could misdate a past expense.
- One or multiple payers, all five split types, and existing optional group tags are supported.
- React Hook Form and Zod validate input; the store revalidates current persisted references and
  saves the expense plus frequent-payer ranking atomically in IndexedDB.
- A missing local membership or active category blocks entry. Receipts and tag creation inside the
  full form remain pending; detail supports tag creation. See [[split-types]], [[paid-by]], and
  [[money-representation-and-rounding]].

### Expense Correction

Editing reuses the entry form, restoring saved paid amounts, participant selections, and split
metadata. Updates preserve creation metadata and existing attachments. An unchanged inactive
category may be retained; a different selection must be active. Saving returns to detail;
cancelling writes nothing. Failed saves retain inputs for retry.
Detail category and tag selection instead quick-save only those references without rebuilding
allocations; see [[expense-edit-delete]].

Detail deletion requires confirmation and atomically removes the expense and owned receipts,
refreshes frequent payers, then returns to the list. All balance displays derive the updated store.
Missing or cross-group detail/edit IDs show a not-found state. See [[expense-edit-delete]].

### Group Settings and Planned Menu

- Delete group prompts for irreversible confirmation, atomically removes group-owned records,
  preserves shared contacts, and returns to the dashboard. See [[group-deletion]] and [[full-backup]].
- Group export is implemented in Settings. Only required group information is initially selected;
  the sender can add categories, tags, members, expenses, and available receipt attachments.
- Expenses automatically select and lock categories and members. Receipts automatically select and
  lock expenses and its dependencies. Explanatory dialogs state why; deselection releases the locks.
- Link, CSV, and ZIP are available without receipts. Receipt selection disables Link/CSV and leaves
  ZIP as the complete transfer. Link generation has a 32,000-character ceiling and displays a
  privacy warning; all formats validate the same versioned snapshot. See [[import-export]].
- CSV/ZIP import is available from `/import`, reached from welcome or dashboard rather than Group
  Settings. Group Settings contains only the export action; import creates a separate editable group
  and does not belong to the current group.
- Human-readable Link/PDF/Excel settlement sharing remains a separate future settlement feature.
- Settings
- Help

---

## Related

- [[onboarding]] — how the user arrives at the main screen for the first time
- [[dashboard]] — current dashboard and planned cross-group sections
- [[layout-architecture]] — current route-aware sidebar/footer and unimplemented navigation stubs
- [[balance-calculation]] — how the Balances tab derives its data
- [[solo-group-support]] — implemented zero-net overview and solo balance behavior
- [[import-export]] — Export and Import options in the group menu
- [[product-roadmap]] — delivery horizons and the unresolved settlement-model decision
