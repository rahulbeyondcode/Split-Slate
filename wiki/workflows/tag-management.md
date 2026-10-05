---
name: tag-management
description: How group-scoped tags are created, renamed, linked to expenses, and deleted
metadata:
  type: workflows
---

# Tag Management

Purpose: describe implemented tag management, expense references, and cascade boundaries.

Last updated: 2026-10-05

## What Tags Are

Tags are durable, free-form records scoped to one group. The same tag cannot be reused across groups; two groups may independently create tags with the same name.

Expenses optionally reference tags through `tagIds[]`. An expense may have no tags, and removing every tag reference leaves the expense valid.

Tag names are trimmed and case-insensitively unique within a group. Every tag also has a required six-digit hex color used as its visual identifier.

## Creating and Renaming Tags

Tags can be created from the group's **Categories & Tags** screen by entering a name and choosing a color. The reusable color picker offers 10 named presets (stored as hex values) plus synchronized custom native-picker and manual hex-code controls. Valid output is always a six-digit hex code. Expense entry can select existing group tags. On mobile, Add new tag opens the same name/color modal as expense detail, persists a new group tag, and selects it in the unfinished form; saving the expense commits the reference. Cancelling the expense after creating a tag leaves the new group tag available. Desktop expense entry has no inline creation action; detail can create one in a modal and attach it automatically.

Every existing tag-creation form (group management, mobile expense entry, and expense detail)
suggests tags from other groups as soon as one letter is typed. Matching works inside the name and
ignores case and separators. Each suggestion shows its color and the groups using that exact name
and color; selecting it creates a separate group-scoped tag with the copied name/color. The expense
entry/detail flows then select or attach the new tag as with manual creation. A name already in the
current group is not suggested. Group setup has no tag-creation screen. See [[category-management]]
for the analogous category behavior.

On expense detail, a dashed Add tags control stays visible even when no tags are assigned. Its
popover lists every group tag with checkbox selections; each toggle saves the expense reference
immediately. Create new tag opens a name/color modal. Creation persists the group tag first, then
attaches it to this expense through the focused reference update. If attachment fails, the new
group tag still exists and an inline error explains the failed expense update. Existing chips
wrap across the full-width row below the banner amount. See [[expense-edit-delete]].

Editing a tag can change its name, color, or both. Expenses reference the tag by ID, so no expense
  rewrite is needed. The expense-entry picker shows current tag names/colors. The full expense list
  and recent Overview rows show up to three colored tag chips per expense; Show more reveals the
  remaining tags and Show less collapses them. The controls do not navigate to expense detail.

---

## Group Categories & Tags Screen

The group **Categories & Tags** screen lists every tag record in the group, including tags not currently used by an expense. It supports add, rename, and delete operations.
On mobile its tag card is 50vh tall within the scrolling page. Tags title, available count, and
Add tag stay sticky while the card's rows scroll; each row places wide, softly rectangular Edit
and Delete buttons below the tag name. Add and Edit open a name/color modal on mobile rather than
expanding the card inline; validation and save errors remain in the modal, and Cancel/Escape dismiss
it without saving. The page title and group header also stay sticky. Tablet and desktop retain
their existing inline form, card, and action layout.

Deleting a tag requires confirmation. `removeTag` performs one read-write IndexedDB transaction
on tags, expenses, and activity events:

1. Read the persisted tag; reject a missing tag, including repeated deletion.
2. Read the current expenses in the persisted tag's group.
3. Delete the tag and update only `tagIds` on existing expenses that reference it.

All reads and writes share the transaction. An expense created before cleanup is included; a
later create/update that still references the deleted tag fails persisted-reference validation.
Concurrent expense edits/deletions and tag removals serialize through the shared tables. Expense
fields, unrelated tags/groups, attachments, and payer rankings are preserved. Any write failure
rolls back the tag deletion and all reference changes without updating Zustand.

After commit, the store removes the tag from memory and replaces that group's expense snapshot
with the persisted records read and cleaned in the transaction. This removes stale deleted rows
from the local view and includes previously unseen expenses. Other groups' expense state is
retained. This refresh is specific to this action; it does not implement automatic cross-tab
synchronization of the full store. See [[state-management]].

### Resolved: Deleted Expense Resurrection

The previous cleanup used `bulkPut` on complete hydrated expense records. A stale snapshot could
therefore recreate a deleted expense or overwrite a newer edit. Reading persisted records and
using reference-only updates resolves that failure: cleanup never inserts an expense. Regression
tests cover stale snapshots, overlapping create/edit/delete operations, concurrent tag removals,
and rollback after a partial cleanup. See [[expense-edit-delete]] and [[testing-strategy]].

---

## Contrast With Categories

Every expense must reference exactly one category, so deleting an in-use category is blocked.
Tags are optional, so removing their references does not require deleting expenses. Tag cleanup
reads current persisted references and updates them atomically.

---

## Related

- [[domain-models]] — Tag shape and `Expense.tagIds[]`
- [[indexeddb-schema]] — tags table and expense references
- [[category-management]] — contrast with mandatory categories
- [[filtering]] — group tags as an expense filter
- [[state-management]] — transactional cleanup and the scope of the local state refresh
- [[expense-edit-delete]] — expense deletion guarantees across tag cleanup
- [[testing-strategy]] — stale-state and concurrent-mutation regression coverage
