---
name: group-deletion
description: Group deletion is permanent and cascades all related data from IndexedDB
metadata:
  type: decisions
---

# Decision: Group Deletion

Last updated: 2026-05-18

## Decision

Groups can be deleted. Deletion is permanent and cannot be undone. The user is clearly warned before proceeding.

## Cascade

Deleting a group removes every piece of data associated with it from IndexedDB — nothing is left behind:

- All `members` with matching `groupId`
- All `expenses` with matching `groupId`
- All `attachments` whose `expenseId` belongs to a deleted expense
- All `categories` with matching `groupId`
- The `group` record itself

After deletion, the group disappears from the groups list immediately.

## Warning

Before deletion is confirmed, the app shows a clear, irreversible-action warning:
> "Deleting this group is permanent and cannot be undone. All expenses, members, categories, and attachments will be deleted."

## Related

- [[indexeddb-schema]] — tables affected by the cascade
- [[expense-edit-delete]] — expense-level deletion (individual expense, not whole group)
