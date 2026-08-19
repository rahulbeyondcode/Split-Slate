---
name: member-management
description: Rules for adding, editing, and removing group members after group creation
metadata:
  type: workflows
---

# Member Management

Last updated: 2026-08-20

A member is a link from a group to a person in the global directory. See [[global-people-directory]] and [[people-directory]].

## Implementation Status

The store implements `addMember` and guarded `removeMember` actions. It blocks removal when the
member appears in an expense and removes a successfully deleted member ID from
`frequentPayerIds`. The people-directory store also blocks deleting a person with expense
involvement and otherwise cleans up that person's member links and payer references.

The current group Members route is read-only: it lists linked people but has no add, edit, remove,
or blocked-removal recovery controls. The expense-filter shortcut described below is also missing
because filtering and expense editing are not implemented. The sections below describe the target
management UX around the existing data-layer guards.

The store guards expense-reference removal, but `addMember` does not verify that its group/person
IDs exist or reject a duplicate `(groupId, personId)` link. `removeMember` does not protect the
creator member. The people UI hides self deletion, while `removePerson` does not enforce that rule
at the store boundary. These are implementation gaps, not current invariants.

## Adding Members

The store can add an existing person to a group, but currently accepts duplicate links and
unverified IDs. The planned UI will allow this after creation, either by picking a person from the
directory or adding a new person inline, and must prevent those invalid calls.

---

## Editing Members

A member has no name or icon of its own — those live on the linked person. The implemented friends
list can edit a person's name/icon, which propagates to every group automatically because rendering
resolves display through `personId`. Expenses reference the member by `memberId` only, so the edit
touches nothing else. See [[people-directory]]. A group-local edit entry point is not implemented.

---

## Two Removal Scopes

Because a person is shared across groups, removal has two distinct meanings:

### Remove from one group

Deletes only the member link for that group; the person stays in the directory. Allowed only if the person has **no involvement in any expense in that group** — i.e. they do not appear in `createdBy`, `paid[]`, or `owes[]` of any expense in the group.

### Delete from the directory

Removes the person everywhere. Allowed only if the person is referenced by **no expense in any group**. On delete, all their member links and any `frequentPayerIds` references are pruned. See [[global-people-directory]].

If they appear in one or more expenses, the relevant removal is blocked.
A creator with no expense involvement can currently be removed through the store. Creator retention
must be added before the removal UI is exposed.

### Planned blocked-removal recovery

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
