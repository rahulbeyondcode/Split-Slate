---
name: domain-models
description: Core data shapes and invariants for split-slate
metadata:
  type: architecture
---

# Domain Models

Purpose: describe persisted domain shapes and their implemented invariants.

Last updated: 2026-09-19

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
- **Deletion** is blocked by the store when the person is involved in an expense. The implemented
  people UI also hides deletion for the self Person, but `removePerson` does not enforce that
  self-protection at the store boundary.

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

**Currency** is singular per group (MVP: no multi-currency). Onboarding and standalone creation set
it, defaulting to INR, and all expense amounts are assumed to use it. There is no dedicated
post-creation currency editor, although the generic `updateGroup` patch action can change it.

**Initial value of `frequentPayerIds`** on group creation: `[creatorMemberId]`. Other members are added after the group row exists, but the creator remains the only frequent payer until expense history exists.

**Implemented update behavior:** expense creation ranks the top five members by positive payer
frequency across the group history, breaking ties by name and then member ID. The expense and
ranking are committed in one transaction. See [[paid-by]].

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
The member picker excludes memberships present in state; `addMember` checks persisted links and
inserts atomically, rejecting duplicate memberships even across concurrent calls. `removeMember`
protects the local user. Referenced-ID existence checks and directory-wide self-deletion protection
remain incomplete. See [[member-management]].

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
- The current Categories & Tags screen can add custom categories. Picking additional master-list
  entries after creation is not exposed as a separate UI.
- **categoryId is mandatory on every expense** — the user must select a category when adding an expense
- Categories can be renamed now. The model/store support deactivation; the expense picker excludes
  inactive categories and creation rejects them. The management toggle remains planned.
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
- Renaming a tag updates one tag record; ID-based expense references need no rewrite. The entry
  picker shows current tag names/colors, but saved expense list/overview rows do not display tags yet.
- Deleting a tag atomically removes its record and references selected from hydrated expense
  state. The cascade does not requery persisted expenses; see [[tag-management]] for its limits.
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

### Money representation

Every monetary value in `transactions.paid[]`, `transactions.owes[]`, and adjustment-type
`splitMeta[]` entries is an integer count of the group's currency minor unit. Shares and percentage
metadata remain unitless ratios. The currency's ISO 4217 exponent determines the scale; it is not
always two decimal places. See [[money-representation-and-rounding]].

Expense creation enforces this representation at the form/store boundary. Decimal input is parsed
exactly, ratios use scaled integer arithmetic, and the shared formatter consumes minor units.

**Enforced creation invariant:** `sum(paid[].amount)` equals `sum(owes[].amount)` with a positive
safe-integer total. Members, category, and optional tags are checked against persisted group
records inside the write transaction. Creation also rejects a save if accumulated group spending
would exceed `Number.MAX_SAFE_INTEGER` minor units, keeping derived balances and spending within
the supported numeric range. Expense edit/delete remain pending.

- `createdAt` is set automatically by the app and never shown to or edited by the user
- `when` is shown in the UI as the expense date — defaults to the current date and time, user can change it
- `tagIds` is always present but may be empty; every referenced tag must belong to the same group as the expense
- `splitMeta` is needed for shares, percentage, and adjustment types — the raw input values cannot be derived back from `owes[]` alone. See [[split-types]] for per-type details.
- `attachmentIds` is always present and creation currently writes an empty array. The separate
  `attachments` table and blob shape exist; ingestion, compression, and lazy-loading UI remain
  pending. Expense hydration does not load that table.

See [[expense-model-design]] for why both arrays are stored, and [[balance-calculation]] for how they are consumed.

---

## Related

- [[balance-calculation]] — how net balances are derived from expenses
- [[money-representation-and-rounding]] — integer minor units and deterministic remainder allocation
- [[indexeddb-schema]] — how these models map to IndexedDB tables
- [[state-management]] — Zustand store shape
- [[tag-management]] — group tag lifecycle and optional expense references
