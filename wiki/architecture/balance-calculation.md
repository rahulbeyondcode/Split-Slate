---
name: balance-calculation
description: Algorithm for computing net balances and deriving who owes whom
metadata:
  type: architecture
---

# Balance Calculation

Last updated: 2026-08-16

## Implementation Status

The committed group overview calculates total group spend inline by summing every `paid`
transaction. The sidebar group item still displays a hardcoded balance placeholder.

There is no committed reusable member-net helper, all-member balance map, debt-simplification
helper, or who-owes-whom screen yet. Expense mutation is also pending, so normal UI flows cannot
create the expense data consumed by the existing read-only group screens.

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

## Target All-Member Algorithm

```ts
function calculateBalances(expenses: Expense[], memberIds: UUID[]): Map<UUID, number> {
  const net = new Map(memberIds.map(id => [id, 0]))

  for (const expense of expenses) {
    for (const { memberId, amount } of expense.transactions.paid) {
      net.set(memberId, net.get(memberId)! + amount)
    }
    for (const { memberId, amount } of expense.transactions.owes) {
      net.set(memberId, net.get(memberId)! - amount)
    }
  }

  return net
}
```

---

## Deriving "Who Owes Whom" (planned)

The target balances view will derive settlement suggestions from the net map:

1. Separate members into creditors (net > 0) and debtors (net < 0)
2. Greedily match largest debtor to largest creditor
3. Produce transfers: "A pays B ₹X"

This is the classic minimum-cash-flow problem. Greedy gives a good-enough (not always optimal) solution for small groups.

---

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
