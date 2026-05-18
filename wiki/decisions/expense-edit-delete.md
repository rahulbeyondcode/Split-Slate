---
name: expense-edit-delete
description: Rules for editing and deleting expenses in MVP — access, scope, and deletion behaviour
metadata:
  type: decisions
---

# Decision: Expense Edit and Delete

Last updated: 2026-05-18

## Decision

Expenses can be fully edited and deleted in MVP.

## Access Control

None in MVP. Since the app is single-device and local, there is only ever one person using the app on a given device. Restricting who can edit or delete an expense is meaningless in this context.

All fields are editable after an expense is saved:
- Expense name
- Amount
- When (date + time)
- Category
- Split type and split details
- Paid-by
- Attachments (add or remove)

## Delete Behaviour

**Hard delete** — the expense record is permanently removed from IndexedDB.

**Cascade:** Deleting an expense also deletes all its associated attachment records from the `attachments` table. No orphaned blobs left behind.

## When This Changes

Access control becomes relevant in **V3** when sync is introduced and multiple real users share the same live group data. Group admin controls (only the creator can edit/delete, read-only members) are already planned as a Pro feature — to be designed when sync is built.

## Related

- [[domain-models]] — Expense shape
- [[indexeddb-schema]] — attachments cascade on expense delete
- [[import-export]] — view-only import mode is already read-only by design (separate from edit/delete controls)
