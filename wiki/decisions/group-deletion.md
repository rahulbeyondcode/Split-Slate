---
name: group-deletion
description: Implemented permanent group deletion with an atomic IndexedDB cascade
metadata:
  type: decisions
---

# Decision: Group Deletion

Purpose: specify the irreversible group-owned data cascade without deleting shared identity.

Last updated: 2026-09-29

## Decision

Group deletion is permanent and cannot be undone. Group Settings shows an in-app confirmation that
names the group and warns about loss of expenses, members, categories, tags, and receipts.
Cancellation makes no changes; after success, navigation returns to the dashboard.

Implementation status: available in Group Settings. See [[confirmation-dialogs]].

## Cascade

One Dexie transaction removes the group and every associated group-owned row from IndexedDB:

- All `members` with matching `groupId`
- All `expenses` with matching `groupId`
- All `attachments` whose `expenseId` belongs to a deleted expense
- All `categories` with matching `groupId`
- All `tags` with matching `groupId`
- The `group` record itself

The global `people` directory, local identity, and data belonging to other groups remain. A failed
write rolls back the entire deletion; Zustand changes only after the transaction commits, so the
group disappears from every group list immediately on success. If onboarding settings refer to the
deleted group, the reference moves to the newest remaining group (`createdAt` descending, ID as a
tie-breaker), or becomes `null` when no groups remain. Completed onboarding stays completed;
users can create another group. An empty-group device remains eligible for [[full-backup]].

## Warning

Before deletion is confirmed, the app must show a clear, irreversible-action warning:
> "Deleting this group is permanent and cannot be undone. All its expenses, members, categories, tags, and receipts will be deleted."

## Related

- [[indexeddb-schema]] — tables affected by the cascade
- [[expense-edit-delete]] — expense-level deletion (individual expense, not whole group)
- [[state-management]] — persisted-first transaction and store update
