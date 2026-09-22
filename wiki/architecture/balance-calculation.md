---
name: balance-calculation
description: Algorithm for computing net balances and deriving who owes whom
metadata:
  type: architecture
---

# Balance Calculation

Purpose: explain exact member balances and deterministic suggested transfers.

Last updated: 2026-09-20

## Implementation Status

Four pure helpers are implemented in `src/shared/utils/balances.ts`:

- `calculateMemberNet(expenses, memberId)` — total paid minus total owed for one member
- `calculateGroupTotal(expenses)` — sums every paid allocation
- `calculateBalances(expenses, memberIds)` — includes all supplied members, including zero balances
- `suggestTransfers(balances)` — returns positive integer transfers that clear a zero-sum balance map

The overview and sidebar use the first two helpers. The `/groups/:groupId/balances` route shows
all-member balances and suggested payments, updating after expense creation, editing, or deletion.
Solo groups show zero net and no suggested payments, with explanatory personal-spending copy.

Accumulation uses BigInt internally and returns safe-integer minor units; currency conversion is
only for display. All-member calculation rejects missing member references and invalid allocations.
Transfer calculation rejects unsafe/fractional balances and nonzero sums instead of silently
showing incomplete settlements. Neither helper mutates inputs.

## Core Formula

For each member within a group:

```
net = totalPaid - totalOwed
```

- **Positive net** → others owe this member
- **Negative net** → this member owes others
- **Zero** → settled

"Balance" here is NOT a bank balance. It is the net position within a group only.

---

## All-Member Algorithm

Initialize every member's net to zero. For every expense, add each paid allocation to its member
and subtract each owed allocation from its member. Convert exact accumulated values to safe
integers at the boundary. Positive values are receivable; negative values are payable.

## Deriving Who Pays Whom

1. Separate positive creditors and negative debtors; work with positive remaining magnitudes.
2. Sort each side by largest remaining amount, breaking equal amounts by ascending member ID.
3. Transfer the smaller of the largest debt and credit, then subtract it from both sides.
4. Remove zero remainders and re-sort before the next match.

Each step clears at least one remaining position. This deterministic greedy algorithm is not
guaranteed to minimize the number of transfers. Suggestions are one way to clear the net balances,
not records of original bilateral debts or payments. The view explicitly says that it does not
record a payment; repayment recording requires the separate roadmap decision.

Ties use IDs, so names and input array order do not change suggested matches. No transfers are
produced for an empty or all-zero balance map.

## Worked Example

**Members:** Alice, Bob, Carol

**Expense 1 — Dinner ₹300**
- paid: Alice ₹300
- owes: Alice ₹100, Bob ₹100, Carol ₹100

**Expense 2 — Taxi ₹120**
- paid: Bob ₹120
- owes: Alice ₹40, Bob ₹40, Carol ₹40

**Net calculation:**

| Member | Paid  | Owes  | Net    |
|--------|-------|-------|--------|
| Alice  | 300   | 140   | +160   |
| Bob    | 120   | 140   | −20    |
| Carol  | 0     | 140   | −140   |

**Settlements:**
- Carol pays Alice ₹140
- Bob pays Alice ₹20

---

## Related

- [[domain-models]] — Expense shape (paid[] and owes[] arrays)
- [[expense-model-design]] — why both arrays are stored on the expense
