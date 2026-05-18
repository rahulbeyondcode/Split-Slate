---
name: domain-models
description: Core data shapes and invariants for owe-it
metadata:
  type: architecture
---

# Domain Models

Last updated: 2026-05-18

## LocalUser (Device Owner)

```ts
{
  id: UUID,
  name: string,
  icon: string    // emoji character e.g. "🦊"
}
```

One per device. Not synced in MVP/V2. Exists outside any group.

---

## Group

```ts
{
  id: UUID,
  name: string,
  icon: string,               // emoji character e.g. "✈️"
  currency: string,           // ISO 4217 code e.g. "INR", "USD", "EUR" — set at group creation, defaults to "INR"
  createdAt: number,          // unix ms
  frequentPayerIds: UUID[]    // up to 5 memberIds, ranked by pay frequency; used by the paid-by quick-select UI
}
```

**Currency** is set once during group creation (MVP: single currency per group, no multi-currency). Default is INR. All expense amounts in the group are assumed to be in this currency.

**Initial value of `frequentPayerIds`** on group creation: `[creatorMemberId, ...otherMemberIds_alphabetical]` — up to 5 total, creator first, rest in alphabetical order by name.

**Updated** after every expense save: top 5 members by pay frequency across all group expenses. Tiebreaker: alphabetical order. Stored here to avoid recomputing at render time. See [[paid-by]] for full UX behaviour.

---

## Member (Group-Scoped)

```ts
{
  id: UUID,
  groupId: UUID,
  name: string,
  icon: string    // emoji character e.g. "🧑"
}
```

**Invariant:** A member's `id` is scoped to a group. The same real person in two groups has two different `memberId` values — by design. See [[group-scoped-members]].

---

## Category

```ts
{
  id: UUID,
  groupId: UUID,
  name: string,
  isActive: boolean
}
```

- Categories are group-specific, not global
- At group creation the creator picks which categories to include from the app's master list (skippable). No categories are auto-created. See [[category-management]].
- Any member can add new categories to a group at any time — either from the master list or custom
- **categoryId is mandatory on every expense** — the user must select a category when adding an expense
- Categories can only be renamed or deactivated — never deleted (deleting would corrupt expense records that reference the category ID)
- Deactivated categories are hidden from the expense entry picker but remain visible on historical expenses

---

## Expense

```ts
{
  expenseId: UUID,
  groupId: UUID,
  expenseName: string,
  createdBy: memberId,
  categoryId: UUID,
  createdAt: number,                         // automatic — when the entry was added to the app
  when: number,                              // user-entered — when the money was actually spent (unix ms, defaults to now, date + time)
  splitType: 'equal' | 'amount' | 'shares' | 'percentage' | 'adjustment',
  splitMeta: { memberId: UUID, value: number }[],  // stores raw split input for view/edit (shares count / percentage / adjustment amount); empty for equal and amount types
  transactions: {
    paid: [{ memberId: UUID, amount: number }],
    owes: [{ memberId: UUID, amount: number }]
  },
  attachmentIds: UUID[]                      // references to the attachments table; empty array if none
}
```

**Invariant:** `sum(paid[].amount)` must equal `sum(owes[].amount)` for every expense.

- `createdAt` is set automatically by the app and never shown to or edited by the user
- `when` is shown in the UI as the expense date — defaults to the current date and time, user can change it
- `splitMeta` is needed for shares, percentage, and adjustment types — the raw input values cannot be derived back from `owes[]` alone. See [[split-types]] for per-type details.
- `attachmentIds` is always present but may be an empty array. Attachment blobs are stored in a separate `attachments` table and loaded lazily — expenses load without pulling image data.

See [[expense-model-design]] for why both arrays are stored, and [[balance-calculation]] for how they are consumed.

---

## Related

- [[balance-calculation]] — how net balances are derived from expenses
- [[indexeddb-schema]] — how these models map to IndexedDB tables
- [[state-management]] — Zustand store shape
