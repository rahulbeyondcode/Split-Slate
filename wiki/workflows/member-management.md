---
name: member-management
description: Rules for adding, editing, and removing group members after group creation
metadata:
  type: workflows
---

# Member Management

Last updated: 2026-05-18

## Adding Members

Members can be added to a group at any time after group creation — not just during onboarding. No restrictions.

---

## Editing Members

Member name and icon can be changed at any time.

Because expenses reference members by `memberId` only (never by name or icon directly), editing a member record updates only the `members` table. All expenses, balances, and history automatically reflect the new name and icon without any other changes. See [[indexeddb-schema]].

---

## Removing Members

A member can only be removed if they have **no involvement in any expense** — i.e. they do not appear in the `paid[]` or `owes[]` array of any expense in the group.

If they do appear in one or more expenses, removal is blocked.

### When Removal Is Blocked

1. App blocks the removal and explains why
2. App offers to **filter the expense list to show only expenses this member is involved in**
3. The user manually edits each of those expenses to remove the member (update the split or paid-by accordingly)
4. Once the member has no expense involvement, removal becomes available

### Why No Force-Delete

Force-removing a member who is referenced in expenses would corrupt the `paid[]` and `owes[]` arrays — dangling `memberId` references with no matching member record. Balance calculations would break. Blocking removal protects data integrity.

### frequentPayerIds Cleanup on Removal

When a member is successfully removed, their `memberId` is also removed from the group's `frequentPayerIds` array if present. Since removal is only possible when the member has no expense involvement, they will not appear in frequency counts — but the array is cleaned up defensively regardless.

---

## Related

- [[domain-models]] — Member shape (group-scoped, referenced by ID everywhere)
- [[indexeddb-schema]] — members table; expenses reference memberIds not names
- [[expense-edit-delete]] — editing expenses to remove a member from their involvement
- [[solo-group-support]] — a group with only the creator as a member is valid
