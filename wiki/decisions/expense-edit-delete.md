---
name: expense-edit-delete
description: Rules for editing and deleting expenses in MVP — access, scope, and deletion behaviour
metadata:
  type: decisions
---

# Decision: Expense Edit and Delete

Purpose: preserve the approved expense correction and deletion design while separating pending work.

Last updated: 2026-09-19

## Implementation Status

Editing and deletion are approved but not implemented. Expense creation and validation are
implemented; update/delete mutations, edit/delete controls, and attachment ingestion/cascades remain
pending. The sections below define target behavior.

## Decision

Expenses will be fully editable and deletable in MVP.

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

Access control would become relevant if optional synchronization lets multiple users share live
group data. Group roles, administrative controls, read-only access, and paid packaging remain
candidates requiring separate design and approval. The historical V3/Pro labels are not delivery
or pricing commitments; see [[product-roadmap]].

## Related

- [[domain-models]] — Expense shape
- [[indexeddb-schema]] — attachments cascade on expense delete
- [[import-export]] — view-only import mode is already read-only by design (separate from edit/delete controls)
- [[product-roadmap]] — current delivery horizons and uncommitted online capabilities
