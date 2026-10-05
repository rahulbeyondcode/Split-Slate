---
name: domain-models
description: Core data shapes and invariants for split-slate
metadata:
  type: architecture
---

# Domain Models

Purpose: describe persisted domain shapes and their implemented invariants.

Last updated: 2026-10-05

## LocalUser (Device Owner)

```ts
{
  id: UUID,
  name: string,
  icon: string    // profile image key e.g. "profile-pic/fox-3d.png"
}
```

One per device. Not synced in MVP/V2. The device owner is also mirrored as a Person (below) sharing this same `id`, so "you" can participate in groups and balances uniformly.

---

## Person (Global Directory)

```ts
{
  id: UUID,
  name: string,
  icon: string    // profile image key e.g. "profile-pic/fox-3d.png"
}
```

A single device-local directory of people ("friends list"), reused across every group. A person is created once and referenced by group members. The device owner appears here too, sharing the `LocalUser` id. See [[global-people-directory]] and [[people-directory]].

- **Editing** a person's name/icon propagates to every group, because members resolve display through the person link
- **Deletion** is blocked by the store when the person is involved in an expense or payment. The implemented
  people UI hides deletion for the self Person, and `removePerson` checks the persisted LocalUser
  before any deletion, including when hydrated identity is stale or absent.

---

## Group

```ts
{
  id: UUID,
  name: string,
  icon: string,               // non-profile image key e.g. "travel-and-places/airplane-3d.png"
  currency: string,           // ISO 4217 code e.g. "INR", "USD", "EUR" — set at group creation, defaults to "INR"
  createdAt: number,          // unix ms
  frequentPayerIds: UUID[]    // up to 5 memberIds, ranked by pay frequency; used by the paid-by quick-select UI
}
```

**Currency** is singular per group (MVP: no multi-currency). Onboarding and standalone creation set
it, defaulting to INR. Settings can change its display/grouping label; if expenses exist, the user
  confirms that their expense and payment amounts will not be exchanged or rewritten. Every amount uses fixed
hundredths regardless of this label.

**Initial value of `frequentPayerIds`** on group creation: `[creatorMemberId]`. Other members are added after the group row exists, but the creator remains the only frequent payer until expense history exists.

**Implemented update behavior:** expense creation, editing, and deletion rank the top five members by positive payer
frequency across the group history, breaking ties by name and then member ID. The expense mutation and
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
protects the local user. Member addition verifies persisted group/person existence in the same
transaction as duplicate detection and insertion. Directory-wide self deletion is store-protected. See [[member-management]].

---

## Category

```ts
{
  id: UUID,
  groupId: UUID,
  name: string,
  icon: string,   // non-profile image key
  isActive: boolean
}
```

- Categories are group-specific, not global
- Each category carries a non-profile PNG key in `icon`; master-list entries ship with preset image keys, and custom categories get a user-picked one. See [[iconography]].
- At group creation the creator picks which categories to include from the app's master list — **at least one is mandatory** (a default set is pre-selected). No categories are auto-created beyond that selection. See [[category-management]].
- The current Categories & Tags screen can add custom categories. Picking additional master-list
  entries after creation is not exposed as a separate UI.
- **categoryId is mandatory on every expense** — the user must select a category when adding an expense
- Categories can be renamed now. The model/store support deactivation; the expense picker excludes
  inactive categories and creation rejects them. Editing may retain its existing inactive category;
  a different category must be active. The management toggle remains planned.
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
- Tags are optional on expenses and payments — each stores zero or more references in `tagIds[]`
- Renaming a tag updates one tag record; ID-based expense references need no rewrite. The entry
  picker and expense detail show current tag names/colors. The full expense list and recent Overview
  rows show up to three colored tag chips per expense, with Show more for additional tags. See
  [[tag-management]].
- Deleting a tag atomically reads persisted group expenses and payments, removes the tag, and updates
  only existing tag references. It does not recreate deleted records or overwrite newer edits;
  after commit, both group collections are refreshed. See [[tag-management]].
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
  when: number,                              // user-entered date + required time of spending (unix ms)
  splitType: 'equal' | 'amount' | 'shares' | 'percentage' | 'adjustment',
  splitMeta: { memberId: UUID, value: string | number }[],  // exact decimal text for ratios; integer hundredths for adjustments; numeric legacy ratios remain readable
  transactions: {
    paid: [{ memberId: UUID, amount: number }],
    owes: [{ memberId: UUID, amount: number }]
  },
  attachmentIds: UUID[]                      // references to the attachments table; empty array if none
}
```

### Money representation

Every monetary value in `transactions.paid[]`, `transactions.owes[]`, and adjustment-type
`splitMeta[]` entries is an integer count of hundredths independent of currency. Shares and percentage
metadata remain unitless ratios, saved as validated decimal strings without conversion to Number.
Equal and amount splits have empty metadata. Legacy numeric ratios remain readable; a validated
save writes their entered text, but cannot recover digits already lost in the old numeric record.
See [[expense-edit-delete]] for that limitation. The app uses two decimal places for every
currency label rather than its ISO exponent. See [[money-representation-and-rounding]].

Expense creation and editing enforce this representation at the form/store boundary. Decimal input is parsed
exactly, ratios use scaled integer arithmetic, and the shared formatter consumes hundredths.

**Enforced create/update invariant:** `sum(paid[].amount)` equals `sum(owes[].amount)` with a positive
safe-integer total. Members, category, and optional tags are checked against persisted group
records inside the write transaction. Creation and editing reject a save if accumulated group spending
would exceed `Number.MAX_SAFE_INTEGER` hundredths, keeping derived balances and spending within
the supported numeric range. An update replaces the old total instead of counting it twice.

- Updates preserve expense/group IDs, creator identity, creation time, and attachment IDs.
- `createdAt` is set automatically and cannot be edited; expense detail shows its recording date
- `when` is the occurred date and time: a new form pre-fills today's local date but leaves time
  blank until the user enters it or chooses **Use current time**
- `tagIds` is always present but may be empty; every referenced tag must belong to the same group as the expense
- `splitMeta` is needed for shares, percentage, and adjustment types — the raw input values cannot be derived back from `owes[]` alone. See [[split-types]] for per-type details.
- `attachmentIds` is always present and creation currently writes an empty array. The separate
  `attachments` table and blob shape exist; ingestion, compression, and lazy-loading UI remain
  pending. Expense hydration does not load that table. Expense deletion atomically removes owned
  attachment records using their `expenseId` index.

See [[expense-model-design]] for why both arrays are stored, and [[balance-calculation]] for how they are consumed.

---

## Payment (`Settlement`)

```ts
{
  id: UUID,
  groupId: UUID,
  kind: 'payment',
  fromMemberId: UUID,
  toMemberId: UUID,
  recordedBy: UUID,
  amount: number,        // positive integer hundredths in the group's currency
  when: number,          // editable unix-ms payment date/time
  createdAt: number,     // automatic recording time
  tagIds: UUID[]         // optional same-group tags
}
```

The payer and recipient are distinct group members; the recorder is the device owner's member in
that group. A payment is neither an expense nor a category-spending event. Its amount adjusts group
net balances, not paid/owed expense transactions. See [[settlement-recording]].

---

## Related

- [[balance-calculation]] — how net balances are derived from expenses
- [[money-representation-and-rounding]] — fixed hundredths and deterministic remainder allocation
- [[indexeddb-schema]] — how these models map to IndexedDB tables
- [[state-management]] — Zustand store shape
- [[tag-management]] — group tag lifecycle and optional expense references
- [[settlement-recording]] — group-only payment lifecycle and exclusions
