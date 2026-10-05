---
name: main-screen
description: Current dashboard-to-group navigation, expense correction, and balance views
metadata:
  type: workflows
---

# Main Screen

Purpose: describe implemented group navigation, expense workflows, balances, and group transfer.

Last updated: 2026-10-06

## Current Implementation

### Home (Dashboard)

After onboarding, the app lands on `/dashboard`. The dashboard lists every group from the Zustand
store and links each row to `/groups/:groupId`. It does not auto-open a group. The dashboard currently
uses store order; it has no `lastActiveAt` field or recent-activity sort. The desktop/tablet sidebar
also lists groups and currently sorts them by `createdAt` descending.

### Group Detail Routes

`/groups/:groupId` is an implemented parent route with nested routes for Overview, Analytics,
Expenses, Add Expense, Expense Detail/Edit, Balances, Members, Categories & Tags, and Settings. The parent resolves the active group's
members, people, categories, tags, expenses, and payments and supplies them to child screens through the
router outlet context. An unknown group shows a not-found state with a return link to the dashboard.

The current child screens are:

- **Overview** — the group's snapshot: local net position, group total in the header, up to six
  members ranked by the number of expenses they paid for, suggested-transfer count, five most
  recent expenses and payments, and a group-only category-spending preview after them with links to full views
- **Analytics** — `/groups/:groupId/analytics` shows all-time category totals for that group, using
  its own currency even when other groups use different currencies; `/analytics` remains app-wide
- **Expenses** — searchable, filterable expenses with recorded payments interleaved by date when
  unfiltered and date-sorted; compact insights and category analytics remain expense-only
- **Add Expense** — `/groups/:groupId/expenses/new`, with validated local recording and five split methods
- **Expense Detail/Edit** — payer/split breakdown and tags, prefilled editing, and confirmed hard deletion
- **Balances** — payment-aware net positions, suggested transfers, Add payment, Settle up prefill,
  recorded payment history, editing, and confirmed deletion
- **Members** — add existing/new people, edit linked names/icons, and confirmed guarded removal
- **Categories & Tags** — add, edit, and guarded-delete controls for both record types
- **Settings** — editable group name/icon and currency, selective Link/CSV/ZIP export, and confirmed permanent group deletion; no import action

On mobile, the group Settings identity card wraps the group name and summary beside the avatar;
Edit name & icon sits below the text instead of squeezing that first row. Desktop keeps the
single-row identity card.

The group's default route opens Overview. Its recent-activity "View all", "View all balances", and
category-spending "View all" links open the full ledger, per-member balances, and group-scoped
Analytics respectively. Expenses is also available through the sidebar and mobile navigation.
There is no additional group-view tab bar. The large local-balance hero appears only on Overview.
The Members and Suggested transfers cards end in full-width, center-labeled actions with right-edge
arrows. The Members title has no count; "Manage Members (N)" carries the full group count and is
available even when every member fits in the preview. The transfer card lists the first three
suggested payer-to-recipient amounts (or "All square!") and its "View all balances (N)" action
shows the total number of suggestions. No payment disclaimer is repeated inside that card.
The two preview cards stack on mobile and tablet, and sit side by side on desktop.
The "Recent transactions" heading and bordered "View all (N)" action sit inside the same card as
the five most recent expense and payment entries (or the empty-state content), linking to the full
Expenses ledger. N counts all of the group's expenses and payments, not just the five shown in the
preview; edit and delete events belong to the separate activity pane, not this card.

The Balances screen has a rounded secondary Back control matching expense detail; it returns to the
originating group screen, including its filter URL. Direct entry without in-app history falls back
to the group's Expenses screen. Group Analytics uses the same Back style without extra top spacing. Group
headers stay visible while scrolling. On mobile, their plain text-and-arrow Back to dashboard link
exits any non-form group screen, including expense detail and Settings; expense forms return to
Expenses first. The desktop sidebar still provides All groups. Expenses scrolls the main pane at
all widths, with the title/subtitle and filter controls sticking below the group header after
insights pass. On desktop and tablet the ledger itself scrolls after ten rendered entries; mobile
reaches the last row in the main pane. Members retains a bounded list. Mobile Categories & Tags
scrolls only the main pane between sections and the content of each 50vh card independently; the
browser window does not scroll. The section titles and Add buttons sit above the cards, not sticky
inside them; the visible page title is omitted. Add/Edit category and tag forms open in dialogs
at every width. On tablet the bounded cards stack vertically; desktop keeps them side by side. See
[[layout-architecture]] and [[filtering]].

On desktop, the activity panel follows group routes except Settings, including expense forms;
the group header no longer has a redundant three-dot shortcut to Settings. The group sidebar
and mobile footer retain Settings navigation. See [[layout-architecture]].

The Overview member preview counts each expense once per member with a positive paid contribution,
even when multiple members pay for the same expense. Higher counts appear first; equal counts and
members with no payments are ordered alphabetically by name. Only six members are shown; the Members
route still lists the entire group. The heading stays "Members" at every width and the footer CTA
always shows the full count. The mobile Members footer and member chips still open the full list.

Changing currency when expenses or payments exist requires confirmation: saved amounts retain their numeric
values and are displayed under the new currency label without exchange conversion. The same
integer hundredths are used for every group currency. See [[money-representation-and-rounding]].

The group header's Add Expense link opens the entry form. Successful saves return to the expense
list and update overview/sidebar balances through the shared store. Failed saves retain form inputs
and show an error; cancellation writes nothing. Submissions are guarded against repeated clicks.
Dashboard and sidebar group rows link to the Overview. The sidebar group-list items display the
local member's calculated net position derived from expense allocations and recorded payments.

The group outlet is keyed by `group.id`. Changing the active group remounts child screens and
resets their form/editor state, including category and tag editors.

---

## In-Group Experience — Current and Planned

The following sections distinguish the existing expense list and entry form from the remaining
target experience. Delivery priorities live in [[product-roadmap]].

### Expense, Payment, and Balance Views

Overview is the default route. Expenses interleaves dated expense rows and distinct green payment
blocks with a transfer icon when unfiltered and date-sorted; filtered and non-date-sorted expense
views hide payments with explanatory copy. Balances shows each member's net after group payments,
current suggested transfers, and a recorded-payment history. Neither view uses a new tab bar.
Net per member and Who owes whom stack on mobile and tablet; desktop retains side-by-side cards.

- Add payment accepts any positive amount between two different group members with an editable
  date/time and optional tags, but no category. One payment is scoped to one group; the user
  allocates any cross-group outside payment manually.
- Add payment, Settle up, and Edit open the same modal rather than an inline form. **Paid by** and
  **Received by** use searchable group-member dropdowns with each person's avatar and name.
  Payment date/time uses the expense form's styled date and 12-hour hour/minute/AM–PM controls;
  new payments start with today's date and no time, while edits restore their saved date/time.
- Settle up preselects the suggested payer, recipient and amount. An amount beyond the suggestion
  warns without blocking the save. Suggested transfers appear as separate, softly tinted cards
  with From/To avatar-and-name columns, a centered direction arrow, and names that wrap rather than
  truncate. An amount row beneath them emphasizes the total and keeps the content-sized Settle up
  button aligned right and prominent in a solid brand color. The introductory payment explanation
  above the cards serves as the only disclaimer. Editing and confirmed deletion recalculate balances.
- Payments are made outside Split Slate and recorded locally; neither suggestions nor opening the
  form moves money. Expenses and category spending/insights remain unchanged. No binary settled
  toggle, automatic confirmation, or notifications are implemented. See [[settlement-recording]].
- The Balances view has no suggested transfers for a solo group (net = 0 with one member) and
  explains its personal-spending purpose. Suggested payments do not record repayments.

### Current Expense List

- Expense name
- Total amount
- Paid by (member name)
- Local date and 12-hour time (`when` — the actual expense time, not `createdAt`)

Expenses and visible payments are sorted by `when` descending. Expense rows show the local date as `12-Jan-2026` and local
12-hour time as `03:45 PM` beneath the
amount, plus payer names and the category icon beside the name. Names link to detail, which offers
editing, quick category/tag changes, and confirmed deletion.
On mobile, full-ledger and recent Overview rows let expense titles wrap beside the category icon;
supporting text follows the title and the amount moves below it (with date/time alongside or below
the amount in the full ledger). The full ledger also spells out the category name before the payer
and split details; Overview already names the category. Tablet and desktop retain their existing
side-by-side rows and ledger metadata.
Detail distinguishes the occurred date/time (separate Date and Time lines in the banner) from the
recording date (`createdAt`) shown
as a quiet "Recorded by [name] · [date]" line between the banner and the Paid by/Split cards. Its
tags span a full-width banner row.
The full ledger and recent Overview entries show up to three colored tags and reveal further tags
with a separate Show more control. The list now has real-time name, date, category, tag,
payer, involved-member, split-type, and amount filters with an active count and clear action.
Mobile hides the redundant results count until a filter is active; desktop retains the unfiltered
count, and invalid bounds still show a correction message.
The compact Expense insights card shows matching count, total, rounded average, and top category;
it does not show member contributions or settlement balances. The group header retains the
full-group total, and a separate link opens full-group Balances. Invalid filters suppress the summary.
Unavailable selected option IDs are pruned when the list remounts. Desktop/mobile browser journeys
exercise the controls and pass in the 2026-10-05 full run; see
[[filtering]] and [[testing-strategy]].

### URGENT: Mobile Expense Form Scrolling — Browser Verification Required

The mobile Add/Edit Expense page previously left document scrolling unlocked while the main pane
was scrollable. The form now scopes overflow to `#main-content`, clips the document and shell, and
removes the main pane's reserved bottom-footer padding (the footer is hidden on expense forms).
The form and split editor do not add inner scroll areas. The Save/Cancel toolbar remains after the
fields and sticky at the bottom of the main scroll pane. Earlier scroll fixes introduced excess
blank space or clipped the last rows: this replacement and scroll-to-last-row behavior must still
be verified in a permitted browser before the issue can be marked resolved. Desktop is unchanged.

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
- The shared expense/payment picker advances Hour to Minute on mobile, tablet, and desktop after a
  valid two-digit 12-hour value or a single digit from 2 to 9; an initial 0 or 1 waits for a second
  digit. Backspace in an empty Minute field returns focus to the end of Hour; deleting minute digits
  first stays in Minute. Mobile split-participant rows toggle when tapped anywhere outside an editable
  value field and show a brand-colored selected background and border; the whole **Select all**
  checkbox label toggles the entire participant list without changing its text. The mobile form can
  also create and select a new tag in a modal without clearing the unfinished expense. Desktop form
  styling remains unchanged.
- In the expense form, Add new category and the mobile-only Add new tag sit beside their choice pills
  with dashed borders. Split-participant names and their value/preview areas are justified to
  opposite sides for each split method, wrapping long names or values rather than hiding them.
- One or multiple payers, all five split types, and existing optional group tags are supported.
- React Hook Form and Zod validate input; the store revalidates current persisted references and
  saves the expense plus frequent-payer ranking atomically in IndexedDB.
- A missing local membership or active category blocks entry. Receipts remain pending. Desktop form
  tag creation is not exposed; expense detail and the mobile form support it. See [[split-types]],
  [[tag-management]], [[paid-by]], and [[money-representation-and-rounding]].

### Expense Correction

Editing reuses the entry form, restoring saved paid amounts, participant selections, and split
metadata. Updates preserve creation metadata and existing attachments. An unchanged inactive
category may be retained; a different selection must be active. Saving returns to detail;
cancelling writes nothing. Failed saves retain inputs for retry.
Detail category and tag selection instead quick-save only those references without rebuilding
allocations; see [[expense-edit-delete]]. On mobile, detail shows Paid by above Split in full-width
cards; tablet and desktop keep the existing two-column layout.

Detail deletion requires confirmation and atomically removes the expense and owned receipts,
refreshes frequent payers, then returns to the list. All balance displays derive the updated store.
Missing or cross-group detail/edit IDs show a not-found state. See [[expense-edit-delete]].

### Group Settings and Transfer

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

---

## Related

- [[onboarding]] — how the user arrives at the main screen for the first time
- [[dashboard]] — current dashboard and planned cross-group sections
- [[layout-architecture]] — current route-aware sidebar/footer and responsive scrolling
- [[balance-calculation]] — how the Balances view derives its data
- [[solo-group-support]] — implemented zero-net overview and solo balance behavior
- [[import-export]] — Group Settings export and the separate app-level import flow
- [[product-roadmap]] — delivery horizons and the unresolved settlement-model decision
