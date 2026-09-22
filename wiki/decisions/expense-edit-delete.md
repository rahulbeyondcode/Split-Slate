---
name: expense-edit-delete
description: Rules for editing and deleting expenses in MVP — access, scope, and deletion behaviour
metadata:
  type: decisions
---

# Decision: Expense Edit and Delete

Purpose: document expense correction, permanent deletion, and their persistence guarantees.

Last updated: 2026-09-23

## Implementation Status

Expense detail, editing, and confirmed hard deletion are implemented. The shared form supports
all five split types, payer/participant changes, date/time, category, and tags. Attachment ingestion
and receipt editing remain pending; updates preserve existing attachment IDs and deletion cleans
up owned attachment records.

## Decision

Expenses will be fully editable and deletable in MVP.

## Access Control

None in MVP. Since the app is single-device and local, there is only ever one person using the app on a given device. Restricting who can edit or delete an expense is meaningless in this context.

Implemented editable fields:
- Expense name
- Amount
- When (date + time)
- Category
- Split type and split details
- Paid-by
- Tags

Adding/removing attachments through the editor remains planned with receipt ingestion.

## Edit Behavior

Expense list and recent-overview names link to `/groups/:groupId/expenses/:expenseId`; editing uses
its `/edit` child path. Both screens constrain lookup to the active group and show a not-found
state for missing or foreign IDs.

The editor restores paid amounts, selected participants (including zero allocations), split method,
and saved ratio/adjustment metadata. Payer and participant array order is retained. Newly added
group members are not automatically selected on historical expenses. Exact-amount blanks reopen
as their resolved stored allocations.

Updates preserve `expenseId`, `groupId`, `createdBy`, `createdAt`, and attachment IDs. If the entered
local minute is unchanged, the original `when` timestamp retains seconds and milliseconds. An
expense may retain its existing inactive category; changing to a different category requires an
active one.

Create and update share monetary/reference validation. Updates replace the old amount when
checking the aggregate spending ceiling. The expense and recalculated payer ranking commit in one
transaction; memory changes only after commit. Cancellation writes nothing; failures retain input
and allow retry. Save handlers guard repeated submissions.

### Resolved: Shares Metadata Precision Loss

New expense saves retain validated shares and percentage inputs as trimmed decimal strings in
`splitMeta.value`. Display and form reconstruction preserve that text; allocation continues to use
scaled BigInt weights. The maximum accepted shares value `9007199254.740991` now survives storage,
reload, and a name-only edit without changing allocations. Monetary adjustment metadata remains
an integer number of minor units. See [[split-types]] and [[money-representation-and-rounding]].

Earlier numeric ratio metadata is still readable and becomes text on a successful validated save.
Already-lost precision cannot be reconstructed: for example, an old numeric record containing
`9007199254.740992` still fails the range check until the user corrects its share input. It is not
silently clamped or rewritten. Even an in-range legacy ratio may have lost digits; the original
input must be re-entered if that precision matters. Rejected edits leave persisted data unchanged.

## Delete Behaviour

**Hard delete** — the expense record is permanently removed from IndexedDB.

**Confirmation:** the detail screen names the expense and warns that its receipts will be deleted
permanently and balances recalculated. Keep expense cancels without writing.

**Cascade:** one transaction deletes attachments by their `expenseId` owner index, deletes the
expense, and recalculates the group's payer ranking from remaining expenses. Index-based cleanup
includes owned receipts omitted from `attachmentIds` and preserves other expenses' attachments.
Any failure rolls back all three writes. Missing/foreign expense IDs are rejected; `updateExpense`
after deletion cannot recreate the expense. The UI guards repeated deletion and offers retry on failure.

**Tag-cleanup interaction:** the stale-tag resurrection bug is resolved. `removeTag` now reads
persisted expenses and updates only existing tag references inside its transaction; it cannot
insert a deleted expense or overwrite a newer edit from hydrated state. Regression tests cover
both stale snapshots and overlapping expense/tag mutations. See [[tag-management]].

## When This Changes

Access control would become relevant if optional synchronization lets multiple users share live
group data. Group roles, administrative controls, read-only access, and paid packaging remain
candidates requiring separate design and approval. The historical V3/Pro labels are not delivery
or pricing commitments; see [[product-roadmap]].

## Related

- [[domain-models]] — Expense shape
- [[indexeddb-schema]] — attachments cascade on expense delete
- [[tag-management]] — persisted-reference cleanup prevents deleted-expense resurrection
- [[import-export]] — view-only import mode is already read-only by design (separate from edit/delete controls)
- [[product-roadmap]] — current delivery horizons and uncommitted online capabilities
