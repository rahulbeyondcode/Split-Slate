---
name: expense-model-design
description: Why expenses store both paid[] and owes[] arrays instead of computing splits on read
metadata:
  type: decisions
---

# Decision: Store Both paid[] and owes[] on Every Expense

Purpose: explain why expenses retain final allocations and split inputs for later reads.

Last updated: 2026-09-23

## Implementation Status

The TypeScript and IndexedDB shapes implement this storage design. Expense creation and editing calculate and
validate all five split methods, then persists final `paid[]`, `owes[]`, `splitType`, and
`splitMeta[]` values. Detail, list, and balance reads consume stored allocations. Editing restores
split inputs; confirmed hard deletion removes the expense and its owned attachments.

## Decision

Each expense explicitly stores:
- `transactions.paid[]` — who paid and how much
- `transactions.owes[]` — who owes and how much
- `splitType` — which split type was used (equal, amount, shares, percentage, adjustment)
- `splitMeta[]` — the raw input values used to compute the split (shares count, percentage, adjustment amount per member)

All four are written together at creation and recomputed together on a validated edit.

## Why

- **Avoids recomputation for balance calculation:** Balance calculation iterates `paid[]` and `owes[]` directly — no split logic needed at read time. See [[balance-calculation]].
- **Supports complex splits:** Multiple payers + multiple payees in one expense, without special-casing.
- **splitType and splitMeta support detail and editing:** For shares, percentage, and adjustment types, the input values (e.g. "Person A had 2 shares") cannot be derived back from `owes[]` alone — the final amounts do not identify the original ratio. Storing splitMeta preserves those inputs for the detail and edit screens.

## What splitMeta Stores (per type)

| splitType  | splitMeta value            |
|------------|---------------------------|
| equal      | empty — not needed         |
| amount     | empty — owes[] has it      |
| shares     | share count as a validated decimal string per member |
| percentage | percentage as a validated decimal string per member |
| adjustment | adjustment amount in currency minor units per member (can be negative) |

Ratio text is trimmed but never converted to Number for storage. Allocation uses scaled BigInt
weights, so retaining the text keeps the editor's inputs identical to those used for calculation.
Numeric ratio metadata from earlier development records is still readable; a successful edit
writes decimal text. This is read compatibility, not recovery of precision already lost during
earlier storage. See [[expense-edit-delete]].

## Tradeoff

- More storage per expense (four fields instead of two)
- Earlier assumption — "split type doesn't need to be stored after entry" — was wrong once view/edit of split details became a requirement

## Invariant

`sum(paid[].amount)` must equal `sum(owes[].amount)`. The React Hook Form/Zod expense form and the
store's independent validation enforce this for creation and updates using integer minor units. The save also
enforces a positive total, valid persisted references, and the aggregate group-spending limit.
Updates exclude the old expense total when checking the group limit and preserve creation metadata. See [[money-representation-and-rounding]].

## Related

- [[domain-models]] — full Expense shape
- [[split-types]] — mechanics and validation rules for all 5 split types
- [[expense-edit-delete]] — ratio edit compatibility and limits
- [[balance-calculation]] — how paid[] and owes[] are consumed
