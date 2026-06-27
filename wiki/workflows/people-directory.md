---
name: people-directory
description: The global friends list — managing people and picking them when building a group
metadata:
  type: workflows
---

# People Directory (Friends List)

Last updated: 2026-06-27

A single device-local list of people, reused across every group. See [[global-people-directory]] for why this is global rather than per-group.

## Friends List Screen

Reached from the dashboard sidebar ("All Friends"). Lists every person with their icon. From here a person can be created, edited, or deleted.

- **Create:** an emoji + name editor adds a new person to the directory.
- **Edit:** name and icon can be changed at any time. The change propagates to every group the person is in, because groups resolve a member's display through the person link rather than storing their own copy.
- **Delete:** allowed only for non-self people and only when the person is referenced by **no expense in any group**. On delete, their group memberships and any frequent-payer references are pruned. If they are in an expense, deletion is blocked and the user is told why.

The device owner appears in the directory as a person too (shared identity with the LocalUser) so "you" can participate and be balanced uniformly.

## Picking People at Group Creation

The member step of group creation lists the existing directory and lets the creator select who belongs in this group. A new person can also be added inline, but it is only saved to the directory on the final Create action.

- Selected existing people are held in the in-memory group form until the final Create action. At that point they are instantiated as group members.
- New inline people are also held in the form first; on Create, they are saved to the directory and then linked into the group.
- The creator (you) is always a member and is not shown as a selectable row.

## Membership vs Person

A group member is a thin link between a group and a person. Removing someone from a single group deletes only that link and leaves the person in the directory. This is distinct from deleting the person entirely — see the two-scope guards in [[member-management]].

## Related

- [[global-people-directory]] — the decision and its rationale
- [[member-management]] — adding, editing, and the two removal scopes
- [[domain-models]] — Person and Member shapes
- [[group-creation]] — the full group build flow this plugs into
