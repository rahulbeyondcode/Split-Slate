---
name: main-screen
description: Current dashboard-to-group navigation, expense recording, and planned balance views
metadata:
  type: workflows
---

# Main Screen

Purpose: distinguish implemented group navigation and expense entry from planned detail and balance views.

Last updated: 2026-09-19

## Current Implementation

### Home (Dashboard)

After onboarding, the app lands on `/dashboard`. The dashboard lists every group from the Zustand
store and links each row to `/groups/:groupId`. It does not auto-open a group. The dashboard currently
uses store order; it has no `lastActiveAt` field or recent-activity sort. The desktop/tablet sidebar
also lists groups and currently sorts them by `createdAt` descending.

### Group Detail Routes

`/groups/:groupId` is an implemented parent route with nested routes for Overview, Expenses,
Add Expense, Members, Categories & Tags, and Settings. The parent resolves the active group's
members, people, categories, tags, and expenses and supplies them to child screens through the
router outlet context. An unknown group shows a not-found state with a return link to the dashboard.

The current child screens are:

- **Overview** — local net position, total spend, category count, members, and up to five recent expenses
- **Expenses** — a list sorted by `when` descending, showing name, total paid, payer names, date/time, and category
- **Add Expense** — `/groups/:groupId/expenses/new`, with validated local recording and five split methods
- **Members** — add existing/new people, edit linked names/icons, and confirmed guarded removal
- **Categories & Tags** — add, edit, and guarded-delete controls for both record types
- **Settings** — read-only group name and currency

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

| Tab | Content | Default? |
|-----|---------|----------|
| Expenses | Chronological list of all expenses in the group | Planned default |
| Balances | Net balance per member — who owes whom, amounts only | Planned |

- Balances tab is **read-only in MVP** — shows who owes whom and how much, nothing else
- No settlement action, no mark-as-settled, no notifications in MVP
- **Settlement design is unresolved:** an earlier V2 proposal paired a binary fully-settled toggle
  with push notifications. The roadmap requires a separate decision comparing that model with
  explicit repayment records, including partial repayment, before implementation.
- The planned Balances view has no suggested transfers for a solo group (net = 0 with one member).

### Current Expense List

- Expense name
- Total amount
- Paid by (member name)
- Date (`when` — the actual expense date, not `createdAt`)

Expenses are sorted by `when` descending. Rows now include payer names, date/time, and category
beside the name and formatted amount. Editing, deletion, and filtering remain pending.

### Expense Recording

- **Add Expense** button — always visible and prominent
- The form defaults to current local date/time, the first active category, one payer, and an equal
  split among all group members. Participants can be deselected; solo groups are supported.
- One or multiple payers, all five split types, and existing optional group tags are supported.
- React Hook Form and Zod validate input; the store revalidates current persisted references and
  saves the expense plus frequent-payer ranking atomically in IndexedDB.
- A missing local membership or active category blocks entry. Receipts and inline tag creation
  remain pending. See [[split-types]], [[paid-by]], and [[money-representation-and-rounding]].

### Planned Group Menu

- Export (Link / CSV / ZIP depending on group size and whether attachments exist)
- Import CSV / ZIP
- Settings
- Help

---

## Related

- [[onboarding]] — how the user arrives at the main screen for the first time
- [[dashboard]] — current dashboard and planned cross-group sections
- [[layout-architecture]] — current route-aware sidebar/footer and unimplemented navigation stubs
- [[balance-calculation]] — how the Balances tab derives its data
- [[solo-group-support]] — implemented zero-net overview and planned solo balance behavior
- [[import-export]] — Export and Import options in the group menu
- [[product-roadmap]] — delivery horizons and the unresolved settlement-model decision
