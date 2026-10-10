---
name: people-directory
description: The global friends list — managing people and picking them when building a group
metadata:
  type: workflows
---

# People Directory (Friends List)

Purpose: explain the shared people directory and its membership/deletion boundaries.

Last updated: 2026-10-10

A single device-local list of people, reused across every group. See [[global-people-directory]] for why this is global rather than per-group.

## Friends List Screen

Reached from the dashboard sidebar on tablet/desktop ("Contacts"). The screen lists contacts other
than the device owner, with their icons, and allows creating, editing, and deleting those contacts.
On mobile, `/friends` still renders the screen and its New contact action when opened directly, but
no in-app navigation link to that route is available: the sidebar is hidden and the bottom nav has
no Contacts item. See [[layout-architecture]].

- **Create:** New contact opens the profile-image picker + name editor in a modal at every width.
  Add contact saves a new person to the directory and closes the modal.
- **Edit:** Edit opens the same name/icon editor in a modal at every width, prefilled from the saved
  contact. Save closes the modal. The change propagates to every group the person is in, because
  groups resolve a member's display through the person link rather than storing their own copy.
- **Delete:** allowed only for non-self people with **no expense or recorded payment references in any group**. On delete, their group memberships and frequent-payer references are pruned. A blocked contact has a clickable muted Delete button. Its popup offers a member-filtered expense link for expense blockers and a group Balances link for payment blockers. See [[settlement-recording]].

The store checks persisted LocalUser identity before directory deletion. Self deletion is rejected
even when hydrated `localUser` or member state is absent. Expense-involvement checks and membership
cleanup otherwise still rely on hydrated state; the multi-record deletion remains sequential.

The device owner is stored in the directory as a Person sharing the LocalUser ID, so "you" can
participate and be balanced uniformly. The Contacts screen deliberately filters out this self
record; the owner can edit their profile in Settings or from their group-member row.

Contact Add/Edit modals use the shared fixed heading/close control and Cancel/Add contact or
Cancel/Save footer; only the body scrolls, containing fields, validation, and save errors. Initial
focus goes to Name. Cancel/Close/Escape discards the unsaved draft and returns focus to the opener;
reopening starts from an empty name or the saved contact. Openers and list rows stay mounted, and
the underlying search/list layout is unchanged. Fields, submission, cancellation, close, and Escape
dismissal are disabled while saving. Failed saves keep the editor open with an error.
See [[layout-architecture]] and [[member-management]].

Revised browser coverage includes Add/Edit persistence, cancellation/reset/focus, profile-image
selection, propagation to linked groups, validation, and fixed header/footer with 16px viewport
clearance at 280, 820, and 1440px. These checks have not been run; earlier passing verification
predates the Contacts modal changes. Execution requires explicit approval.

## Picking People at Group Creation

The member step of group creation lists the existing directory and lets the creator select who
belongs in this group. A new person can also be added through the all-width Add a person draft modal,
but is only saved to the directory on the final Create action. See [[member-management]].

- Selected existing people are held in the in-memory group form until the final Create action. At that point they are instantiated as group members.
- New draft people are also held in the form first; on Create, they are saved to the directory and then linked into the group.
- The creator (you) is always a member and is not shown as a selectable row.

## Membership vs Person

A group member is a thin link between a group and a person. Removing someone from a single group deletes only that link and leaves the person in the directory. This is distinct from deleting the person entirely — see the two-scope guards in [[member-management]].

## Related

- [[global-people-directory]] — the decision and its rationale
- [[member-management]] — adding, editing, and the two removal scopes
- [[domain-models]] — Person and Member shapes
- [[group-creation]] — the full group build flow this plugs into
