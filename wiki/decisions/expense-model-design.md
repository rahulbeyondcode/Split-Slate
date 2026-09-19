---
name: expense-model-design
description: Why expenses store both paid[] and owes[] arrays instead of computing splits on read
metadata:
  type: decisions
---

# Decision: Store Both paid[] and owes[] on Every Expense

Purpose: explain why expenses retain final allocations and split inputs for later reads.

Last updated: 2026-09-19

## Implementation Status

The TypeScript and IndexedDB shapes implement this storage design. Expense creation calculates and
validates all five split methods, then persists final `paid[]`, `owes[]`, `splitType`, and
`splitMeta[]` values. List and balance reads consume stored allocations. Expense detail, editing,
and deletion remain pending.

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
- **splitType and splitMeta support planned detail and editing:** For shares, percentage, and adjustment types, the input values (e.g. "Person A had 2 shares") cannot be derived back from `owes[]` alone — the final amounts do not identify the original ratio. Storing splitMeta preserves those inputs for the future detail and edit screens.

## What splitMeta Stores (per type)

| splitType  | splitMeta value            |
|------------|---------------------------|
| equal      | empty — not needed         |
| amount     | empty — owes[] has it      |
| shares     | share count per member     |
| percentage | percentage per member      |
| adjustment | adjustment amount in currency minor units per member (can be negative) |

## Tradeoff

- More storage per expense (four fields instead of two)
- Earlier assumption — "split type doesn't need to be stored after entry" — was wrong once view/edit of split details became a requirement

## Invariant

`sum(paid[].amount)` must equal `sum(owes[].amount)`. The React Hook Form/Zod expense form and the
store's independent validation enforce this for creation using integer minor units. The save also
enforces a positive total, valid persisted references, and the aggregate group-spending limit.
Update validation remains pending. See [[money-representation-and-rounding]].

## Related

- [[domain-models]] — full Expense shape
- [[split-types]] — mechanics and validation rules for all 5 split types
- [[balance-calculation]] — how paid[] and owes[] are consumed
