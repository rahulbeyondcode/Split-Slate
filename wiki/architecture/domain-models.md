---
name: domain-models
description: Core data shapes and invariants for split-slate
metadata:
  type: architecture
---

# Domain Models

Last updated: 2026-08-12

## LocalUser (Device Owner)

```ts
{
  id: UUID,
  name: string,
  icon: string    // emoji character e.g. "🦊"
}
```

One per device. Not synced in MVP/V2. The device owner is also mirrored as a Person (below) sharing this same `id`, so "you" can participate in groups and balances uniformly.

---

## Person (Global Directory)

```ts
{
  id: UUID,
  name: string,
  icon: string    // emoji character e.g. "🦊"
}
```

A single device-local directory of people ("friends list"), reused across every group. A person is created once and referenced by group members. The device owner appears here too, sharing the `LocalUser` id. See [[global-people-directory]] and [[people-directory]].

- **Editing** a person's name/icon propagates to every group, because members resolve display through the person link
- **Deletion** is allowed only when the person is referenced by no expense in any group

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

## Member (Group ↔ Person Link)

```ts
{
  id: UUID,
  groupId: UUID,
  personId: UUID    // references a Person in the global directory
}
```

A member is a thin link between a group and a person — it carries no name or icon of its own. Display name/icon are resolved through `personId`. Expenses reference the member by `id` (`memberId`), so editing the linked person never touches expense records.

**Invariant:** The same real person in two groups is the **same** Person, linked by two member rows. See [[global-people-directory]].

---

## Category

```ts
{
  id: UUID,
  groupId: UUID,
  name: string,
  icon: string,   // emoji
  isActive: boolean
}
```

- Categories are group-specific, not global
- Each category carries an emoji `icon`; master-list entries ship with preset icons, custom categories get a user-picked one
- At group creation the creator picks which categories to include from the app's master list — **at least one is mandatory** (a default set is pre-selected). No categories are auto-created beyond that selection. See [[category-management]].
- Any member can add new categories to a group at any time — either from the master list or custom
- **categoryId is mandatory on every expense** — the user must select a category when adding an expense
- Categories can be renamed or deactivated at any time. Deactivated categories are hidden from the expense entry picker but remain visible on historical expenses
- Categories can be **deleted only when no expense references them** — because `categoryId` is mandatory and singular, an in-use category must have all its expenses reassigned to another category before it can be deleted. See [[category-management]]

---

## Tag

```ts
{
  id: UUID,
  groupId: UUID,
  name: string,
  color: string    // required six-digit hex color, e.g. "#6366f1"
}
```

- Tags are durable group-scoped records and cannot be reused across groups
- Tag names are trimmed and case-insensitively unique within one group; different groups may use the same name
- Every tag has a required color used as its visual identifier
- Tags are optional on expenses — an expense stores zero or more tag references in `tagIds[]`
- Renaming a tag updates one tag record, so every referencing expense shows the new name automatically
- Deleting a tag atomically removes the tag record and its ID from every expense in the group; the expenses remain valid
- Tags have no `isActive` field; they are either present or deleted

See [[tag-management]] for the full lifecycle.

---

## Expense

```ts
{
  expenseId: UUID,
  groupId: UUID,
  expenseName: string,
  createdBy: memberId,
  categoryId: UUID,
  tagIds: UUID[],                            // optional references to group tags; empty when no tags apply
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
- `tagIds` is always present but may be empty; every referenced tag must belong to the same group as the expense
- `splitMeta` is needed for shares, percentage, and adjustment types — the raw input values cannot be derived back from `owes[]` alone. See [[split-types]] for per-type details.
- `attachmentIds` is always present but may be an empty array. Attachment blobs are stored in a separate `attachments` table and loaded lazily — expenses load without pulling image data.

See [[expense-model-design]] for why both arrays are stored, and [[balance-calculation]] for how they are consumed.

---

## Related

- [[balance-calculation]] — how net balances are derived from expenses
- [[indexeddb-schema]] — how these models map to IndexedDB tables
- [[state-management]] — Zustand store shape
- [[tag-management]] — group tag lifecycle and optional expense references
