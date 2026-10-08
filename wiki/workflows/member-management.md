---
name: member-management
description: Rules for adding, editing, and removing group members after group creation
metadata:
  type: workflows
---

# Member Management

Purpose: document member management, persisted membership guards, and remaining recovery limits.

Last updated: 2026-10-09

A member is a link from a group to a person in the global directory. See [[global-people-directory]] and [[people-directory]].

## Implementation Status

The store implements `addMember` and guarded `removeMember` actions. It blocks removal when the
member appears in an expense or recorded payment and removes a successfully deleted member ID from
`frequentPayerIds`. The people-directory store also blocks deleting a person with expense/payment
involvement and otherwise cleans up that person's member links and payer references.

The group Members route supports adding existing or new people, editing the linked person's
name/icon, and confirmed removal. A member with expense or payment references has a greyed-out but
clickable Delete button that explains both counts. Expense blockers link to the list prefiltered by
that member's ID; payment blockers link to recorded payments on Balances. Expense editing and
deletion are available through detail. See [[settlement-recording]].
On mobile, each member row gives the avatar and one-line name the full first row; long names are
truncated with a `data-tooltip` revealing the full name on hover or focus/tap. Edit and Delete sit
in a second row, filling the width available after the avatar offset with compact rounded corners.
On mobile Add member opens a modal containing the existing-friend picker and the new-person editor;
Edit opens the person editor in a modal. Errors remain visible inside the modal, and Cancel/Escape
dismisses it without saving. Tablet and desktop retain inline add/edit forms and their existing row
presentation and controls.

`addMember` checks persisted group/person existence and `(groupId, personId)` links, then inserts
within one read-write transaction spanning groups, people, and members. Concurrent calls cannot
create duplicate memberships even when client state is stale. `removeMember` rejects missing
members and protects the local user's member link. `removePerson` separately checks persisted
LocalUser identity before deletion, even if hydrated identity is missing.

Expense involvement is checked from hydrated state; payment references are rechecked against
persisted rows within the removal transaction. `removeMember` deletes its link and updates payer
references in one transaction; `removePerson` deletes the person and member links and updates
affected groups in one transaction. Failed transactions leave those records unchanged.

## Adding Members

### During Onboarding and Group Creation

Both setup flows share **Add another member**, which opens the themed **Add a person** modal at
every viewport width. The existing name/icon editor renders without a second card frame inside
the dialog; other uses of that editor keep their existing styling. The modal title and Cancel/Add
person footer stay outside its bounded, independently scrolling name/icon body, so the actions
remain visible on short screens. Validation stays in the modal,
and a successful Add person appends an in-memory selection rather than writing to IndexedDB.
The shared editor dialog explicitly focuses its first enabled form field after `showModal()`,
without scrolling. React's mount-time autofocus runs while the dialog is closed; native dialog
opening can otherwise focus the overflowing name/icon body instead of the Name input.
Cancel/Escape leaves existing selections intact and returns focus to the opener. Onboarding's
Save and Finish remains disabled while this editor is open. People and membership writes still
wait for Save and Finish or the standalone final Create group submission. See [[onboarding]] and
[[group-creation]].

### After Group Creation

Members can be added to a group at any time after group creation — not just during onboarding. Either pick an existing person from the directory or add a new person inline from the group-details Members screen. People already linked to the group are excluded from the picker, and the store rejects duplicate memberships defensively.

The Members screen opens the new-person form on the first Add member click, while also showing
available existing friends for one-click linking. On mobile they appear together in a modal; on
tablet and desktop they remain inline. Cancel closes the add form.

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

Deletes only the member link for that group; the person stays in the directory. Allowed only if the person has **no involvement in expenses or recorded payments in that group** — neither an expense creator/payer/participant nor a payment payer/recipient/recorder. An eligible removal requires confirmation that states the person remains in the directory. The device owner cannot be removed from their group.

### Delete from the directory

Removes the person everywhere. Allowed only if their group memberships are referenced by **no
expense or payment in any group**. On delete, all their member links and `frequentPayerIds`
references are pruned. Blocked directory deletion offers expense links and each affected group's
Balances route for payment records. See [[global-people-directory]] and [[people-directory]].

If they appear in expenses or payments, the relevant removal is blocked.
Both removal scopes protect the device owner. The directory guard reads persisted LocalUser before
any deletion, rather than relying only on hidden UI controls or hydrated identity.

### Blocked-Removal Recovery

1. The app blocks removal and explains expense/payment involvement. The expense link applies a
   member-involved URL filter; the payment link opens Balances.
2. Edit expense paid-by/split references or payment participants, or delete records with confirmation.
3. Once neither type references the member, removal becomes available.

Editing preserves `createdBy`; creator references cannot be reassigned. An expense whose creator
must be removed must itself be deleted. The filter link also includes creator-only references.

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
- [[onboarding]] — modal draft-member entry before setup completion
- [[group-creation]] — shared modal and final-submit persistence
