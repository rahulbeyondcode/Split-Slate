---
name: main-screen
description: Current dashboard-to-group navigation and the planned in-group expense/balance structure
metadata:
  type: workflows
---

# Main Screen

Last updated: 2026-08-16

## Current Implementation

### Home (Dashboard)

After onboarding, the app lands on `/dashboard`. The dashboard lists every group from the Zustand
store and links each row to `/groups/:groupId`. It does not auto-open a group. The dashboard currently
uses store order; it has no `lastActiveAt` field or recent-activity sort. The desktop/tablet sidebar
also lists groups and currently sorts them by `createdAt` descending.

### Group Detail Routes

`/groups/:groupId` is a committed parent route with nested routes for Overview, Expenses, Members,
Categories & Tags, and Settings. The parent resolves the active group's members, people, categories,
tags, and expenses once and supplies them to child screens through the router outlet context. An
unknown group shows a not-found state with a return link to the dashboard.

The current child screens are:

- **Overview** — local net position, total spend, category count, members, and up to five recent expenses
- **Expenses** — a read-only list sorted by `when` descending, showing expense name and total paid
- **Members** — a read-only list resolved through the global people directory
- **Categories & Tags** — add, edit, and guarded-delete controls for both record types
- **Settings** — read-only group name and currency

The group header's Add Expense link currently opens the lightweight Expenses route; no entry form
exists yet. Dashboard and sidebar group rows link to the Overview. The sidebar displays the local
member's calculated net position derived from paid and owed transactions.

---

## Target In-Group Design

The following sections describe the intended MVP experience beyond the lightweight committed
screens.

Low-priority TODO: if someone manually replaces `:groupId` in the browser URL while a category or tag editor is open, reset the editor's local state for the new group. Normal in-app navigation unmounts the group screen and is unaffected; group IDs are UUIDs, so this is not a priority for the current flow.

### Expense and Balance Views

| Tab | Content | Default? |
|-----|---------|----------|
| Expenses | Chronological list of all expenses in the group | Planned default |
| Balances | Net balance per member — who owes whom, amounts only | Planned |

- Balances tab is **read-only in MVP** — shows who owes whom and how much, nothing else
- No settlement action, no mark-as-settled, no notifications in MVP
- **V2:** Settlement toggle (binary — fully settled or not) paired with push notifications that remind the group owner about unsettled debts. Partial settlement tracking is explicitly deferred until user demand justifies it.
- In a solo group, the Balances tab is always empty (net = 0 with one member)

### Planned Expense List

- Expense name
- Total amount
- Paid by (member name)
- Date (`when` — the actual expense date, not `createdAt`)

Expenses are sorted by `when` descending in the current lightweight route. The target row adds payer
and date details to the currently displayed expense name and total.

### Planned Primary CTA

- **Add Expense** button — always visible and prominent
- **Current implementation TODO:** the button currently opens the lightweight expense-list route; the add-expense form will be implemented next

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
- [[solo-group-support]] — solo groups always show an empty Balances tab
- [[import-export]] — Export and Import options in the group menu
