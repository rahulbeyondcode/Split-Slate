---
name: group-deletion
description: Approved pending design for permanent group deletion and its IndexedDB cascade
metadata:
  type: decisions
---

# Decision: Group Deletion

Last updated: 2026-08-12

## Decision

Group deletion will be permanent and cannot be undone. The user must be clearly warned before proceeding.

Implementation status: approved design, not yet implemented. The current group store and settings screen do not expose group deletion.

## Cascade

When implemented, deleting a group must remove every piece of data associated with it from IndexedDB — nothing may be left behind:

- All `members` with matching `groupId`
- All `expenses` with matching `groupId`
- All `attachments` whose `expenseId` belongs to a deleted expense
- All `categories` with matching `groupId`
- All `tags` with matching `groupId`
- The `group` record itself

After a successful deletion, the group must disappear from the groups list immediately.

## Warning

Before deletion is confirmed, the app must show a clear, irreversible-action warning:
> "Deleting this group is permanent and cannot be undone. All expenses, members, categories, tags, and attachments will be deleted."

## Related

- [[indexeddb-schema]] — tables affected by the cascade
- [[expense-edit-delete]] — expense-level deletion (individual expense, not whole group)
