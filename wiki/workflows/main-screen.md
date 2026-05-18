---
name: main-screen
description: Home screen layout, group navigation, and in-group tab structure
metadata:
  type: workflows
---

# Main Screen

Last updated: 2026-05-18

## Home (Groups List)

After onboarding, the app always lands on the **groups list** — all groups the user has created, sorted by most recently active.

- Most recently active group is always at the top
- One tap enters a group
- If the user has only one group, the list has one item — still one tap to enter
- No auto-navigation to the last active group — avoids landing in the wrong group when multiple groups are active simultaneously

---

## Inside a Group

### Tabs

| Tab | Content | Default? |
|-----|---------|----------|
| Expenses | Chronological list of all expenses in the group | Yes |
| Balances | Net balance per member — who owes whom, amounts only | No |

- Balances tab is **read-only in MVP** — shows who owes whom and how much, nothing else
- No settlement action, no mark-as-settled, no notifications in MVP
- **V2:** Settlement toggle (binary — fully settled or not) paired with push notifications that remind the group owner about unsettled debts. Partial settlement tracking is explicitly deferred until user demand justifies it.
- In a solo group, the Balances tab is always empty (net = 0 with one member)

### Expense List (each row shows)

- Expense name
- Total amount
- Paid by (member name)
- Date (`when` — the actual expense date, not `createdAt`)

Expenses are sorted by `when` descending — most recent expense date first.

### Primary CTA

- **Add Expense** button — always visible and prominent

### Group Menu

- Export (Link / CSV / ZIP depending on group size and whether attachments exist)
- Import CSV / ZIP
- Settings
- Help

---

## Related

- [[onboarding]] — how the user arrives at the main screen for the first time
- [[balance-calculation]] — how the Balances tab derives its data
- [[solo-group-support]] — solo groups always show an empty Balances tab
- [[import-export]] — Export and Import options in the group menu
