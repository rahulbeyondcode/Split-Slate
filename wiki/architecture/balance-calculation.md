---
name: balance-calculation
description: Algorithm for computing net balances and deriving who owes whom
metadata:
  type: architecture
---

# Balance Calculation

Purpose: explain exact member balances and deterministic suggested transfers.

Last updated: 2026-10-05

## Implementation Status

Four pure helpers are implemented in `src/shared/utils/balances.ts`:

- `calculateMemberNet(expenses, memberId, settlements?)` — expense net plus external payments made minus payments received
- `calculateGroupTotal(expenses)` — sums every paid allocation
- `calculateBalances(expenses, memberIds, settlements?)` — includes all members and recorded group payments
- `suggestTransfers(balances)` — returns positive integer transfers that clear a zero-sum balance map

The overview and sidebar use the first two helpers. The `/groups/:groupId/balances` route shows
all-member balances and suggested payments, updating after expense or payment changes.
Solo groups show zero net and no suggested payments, with explanatory personal-spending copy.

Accumulation uses BigInt internally and returns safe-integer hundredths; changing a group's
currency relabels the same numeric balance without exchange conversion. All-member calculation
rejects missing member references, invalid allocations, and invalid payment amounts or members.
Expense and payment writes/deletions also reject a change that would push a derived member balance
outside the safe-integer range; spending totals alone do not guard against offsetting large payments.
Transfer calculation rejects unsafe/fractional balances and nonzero sums instead of silently
showing incomplete settlements. Neither helper mutates inputs.

## Core Formula

For each member within a group:

```
net = expensePaid - expenseOwed + paymentsMade - paymentsReceived
```

- **Positive net** → others owe this member
- **Negative net** → this member owes others
- **Zero** → settled

"Balance" here is NOT a bank balance. It is the net position within a group only.

---

## All-Member Algorithm

Initialize every member's net to zero. For every expense, add each paid allocation to its member
and subtract each owed allocation. For each group payment, add its amount to the payer's net and
subtract it from the recipient's. Convert exact accumulated values to safe integers at the boundary.
Positive values are receivable; negative values are payable. `calculateGroupTotal` and category
analytics still sum only expense allocations. See [[settlement-recording]].

## Deriving Who Pays Whom

1. Separate positive creditors and negative debtors; work with positive remaining magnitudes.
2. Sort each side by largest remaining amount, breaking equal amounts by ascending member ID.
3. Transfer the smaller of the largest debt and credit, then subtract it from both sides.
4. Remove zero remainders and re-sort before the next match.

Each step clears at least one remaining position. This deterministic greedy algorithm is not
guaranteed to minimize the number of transfers. Suggestions are one way to clear the net balances,
not records of original bilateral debts or payments. A suggested transfer pre-fills **Settle up**;
only saving that form creates a payment record. Overpayment is warned about, not blocked.

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

**Suggested transfers before payments:**
- Carol pays Alice ₹140
- Bob pays Alice ₹20

If Carol records an external payment of ₹50 to Alice, Carol's net becomes −₹90 and Alice's becomes
+₹110. The original expenses still total ₹420.

---

## Related

- [[domain-models]] — Expense shape (paid[] and owes[] arrays)
- [[expense-model-design]] — why both arrays are stored on the expense
- [[settlement-recording]] — payment scope, form, correction, and exclusions
