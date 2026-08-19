---
name: expense-model-design
description: Why expenses store both paid[] and owes[] arrays instead of computing splits on read
metadata:
  type: decisions
---

# Decision: Store Both paid[] and owes[] on Every Expense

Last updated: 2026-08-20

## Implementation Status

The TypeScript and IndexedDB shapes implement this storage design, and existing read paths consume
`paid[]` and `owes[]`. Expense creation, editing, calculation, and validation are not implemented.

## Decision

Each expense explicitly stores:
- `transactions.paid[]` — who paid and how much
- `transactions.owes[]` — who owes and how much
- `splitType` — which split type was used (equal, amount, shares, percentage, adjustment)
- `splitMeta[]` — the raw input values used to compute the split (shares count, percentage, adjustment amount per member)

All four are written at expense-creation time and stored as-is.

## Why

- **Avoids recomputation for balance calculation:** Balance calculation iterates `paid[]` and `owes[]` directly — no split logic needed at read time. See [[balance-calculation]].
- **Supports complex splits:** Multiple payers + multiple payees in one expense, without special-casing.
- **splitType and splitMeta are needed for view and edit:** The user can view how an expense was split and edit it later. For shares, percentage, and adjustment types, the original input values (e.g. "Person A had 2 shares") cannot be derived back from `owes[]` alone — the final amounts don't tell you the ratio. Storing splitMeta preserves the full picture.

## What splitMeta Stores (per type)

| splitType  | splitMeta value            |
|------------|---------------------------|
| equal      | empty — not needed         |
| amount     | empty — owes[] has it      |
| shares     | share count per member     |
| percentage | percentage per member      |
| adjustment | adjustment amount per member (can be negative) |

## Tradeoff

- More storage per expense (four fields instead of two)
- Earlier assumption — "split type doesn't need to be stored after entry" — was wrong once view/edit of split details became a requirement

## Invariant

`sum(paid[].amount)` must equal `sum(owes[].amount)`. This will be enforced by the planned expense
form and save mutation; there is no current React Hook Form/Zod expense validation path.

## Related

- [[domain-models]] — full Expense shape
- [[split-types]] — mechanics and validation rules for all 5 split types
- [[balance-calculation]] — how paid[] and owes[] are consumed
