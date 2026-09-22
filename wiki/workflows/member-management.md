---
name: member-management
description: Rules for adding, editing, and removing group members after group creation
metadata:
  type: workflows
---

# Member Management

Purpose: document member management, persisted membership guards, and remaining recovery limits.

Last updated: 2026-09-20

A member is a link from a group to a person in the global directory. See [[global-people-directory]] and [[people-directory]].

## Implementation Status

The store implements `addMember` and guarded `removeMember` actions. It blocks removal when the
member appears in an expense and removes a successfully deleted member ID from
`frequentPayerIds`. The people-directory store also blocks deleting a person with expense
involvement and otherwise cleans up that person's member links and payer references.

The group Members route supports adding existing or new people, editing the linked person's
name/icon, and confirmed removal. It explains blocked removals before asking for confirmation.
Expense editing and deletion are available through detail. Filtering and a filter-to-fix shortcut
remain pending.

`addMember` checks persisted group/person existence and `(groupId, personId)` links, then inserts
within one read-write transaction spanning groups, people, and members. Concurrent calls cannot
create duplicate memberships even when client state is stale. `removeMember` rejects missing
members and protects the local user's member link. `removePerson` separately checks persisted
LocalUser identity before deletion, even if hydrated identity is missing.

Expense-involvement removal guards and other person/member cascade steps still use hydrated state
and sequential writes; the additions above do not make every deletion operation transactional.

## Adding Members

Members can be added to a group at any time after group creation — not just during onboarding. Either pick an existing person from the directory or add a new person inline from the group-details Members screen. People already linked to the group are excluded from the picker, and the store rejects duplicate memberships defensively.

The Members screen ignores repeated additions while a save is pending and disables its add form
and member edit/delete controls until that save finishes. The database transaction is the
authoritative duplicate guard; an in-memory check alone allows concurrent calls to pass before
either insert has committed. Creating a new person and then linking them remains sequential.

---

## Editing Members

A member has no name or icon of its own — those live on the linked person. The group-details Members screen edits the linked person's name/icon directly, so the change propagates to every group because rendering resolves display through `personId`. Editing the device owner also updates `LocalUser` to keep the self identity synchronized. Expenses reference the member by `memberId` only, so the edit touches nothing else. See [[people-directory]].

---

## Two Removal Scopes

Because a person is shared across groups, removal has two distinct meanings:

### Remove from one group

Deletes only the member link for that group; the person stays in the directory. Allowed only if the person has **no involvement in any expense in that group** — i.e. they do not appear in `createdBy`, `paid[]`, or `owes[]` of any expense in the group. An eligible removal requires confirmation that explicitly states the person remains in the friends directory. The device owner cannot be removed from a group they created.

### Delete from the directory

Removes the person everywhere. Allowed only if the person is referenced by **no expense in any group**. On delete, all their member links and any `frequentPayerIds` references are pruned. See [[global-people-directory]].

If they appear in one or more expenses, the relevant removal is blocked.
Both removal scopes protect the device owner. The directory guard reads persisted LocalUser before
any deletion, rather than relying only on hidden UI controls or hydrated identity.

### Blocked-Removal Recovery

1. The app blocks removal and explains expense involvement before confirmation.
2. Open the relevant expenses from the list. Edit their paid-by and split references or delete the
   expenses with confirmation.
3. Once no expense references the member, removal becomes available.

Editing preserves `createdBy`; creator references cannot be reassigned. An expense whose creator
must be removed must itself be deleted. There is no filter-to-fix shortcut yet.

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
