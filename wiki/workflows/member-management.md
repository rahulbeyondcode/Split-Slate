---
name: member-management
description: Rules for adding, editing, and removing group members after group creation
metadata:
  type: workflows
---

# Member Management

Last updated: 2026-05-18

A member is a link from a group to a person in the global directory. See [[global-people-directory]] and [[people-directory]].

## Adding Members

Members can be added to a group at any time after group creation — not just during onboarding. Either pick an existing person from the directory or add a new person inline. No restrictions.

---

## Editing Members

A member has no name or icon of its own — those live on the linked person. Editing a person's name/icon (from the friends list) propagates to every group automatically, because expenses and rendering resolve display through `personId`. Expenses reference the member by `memberId` only, so the edit touches nothing else. See [[people-directory]].

---

## Two Removal Scopes

Because a person is shared across groups, removal has two distinct meanings:

### Remove from one group

Deletes only the member link for that group; the person stays in the directory. Allowed only if the person has **no involvement in any expense in that group** — i.e. they do not appear in `createdBy`, `paid[]`, or `owes[]` of any expense in the group.

### Delete from the directory

Removes the person everywhere. Allowed only if the person is referenced by **no expense in any group**. On delete, all their member links and any `frequentPayerIds` references are pruned. See [[global-people-directory]].

If they appear in one or more expenses, the relevant removal is blocked.

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
