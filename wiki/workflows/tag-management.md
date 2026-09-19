---
name: tag-management
description: How group-scoped tags are created, renamed, linked to expenses, and deleted
metadata:
  type: workflows
---

# Tag Management

Purpose: describe implemented tag management, expense references, and cascade boundaries.

Last updated: 2026-09-19

## What Tags Are

Tags are durable, free-form records scoped to one group. The same tag cannot be reused across groups; two groups may independently create tags with the same name.

Expenses optionally reference tags through `tagIds[]`. An expense may have no tags, and removing every tag reference leaves the expense valid.

Tag names are trimmed and case-insensitively unique within a group. Every tag also has a required six-digit hex color used as its visual identifier.

## Creating and Renaming Tags

Tags can be created from the group's **Categories & Tags** screen by entering a name and choosing a color. The reusable color picker offers 10 named presets (stored as hex values) plus synchronized custom native-picker and manual hex-code controls. Valid output is always a six-digit hex code. Expense entry can select existing group tags. Inline tag creation from that form remains pending; new tags are created in Categories & Tags.

Editing a tag can change its name, color, or both. Expenses reference the tag by ID, so no expense
rewrite is needed. The expense-entry picker shows current tag names/colors. Saved expense list and
overview rows do not yet render tags; displaying tags there remains pending.

---

## Group Categories & Tags Screen

The group **Categories & Tags** screen lists every tag record in the group, including tags not currently used by an expense. It supports add, rename, and delete operations.

Deleting a tag requires confirmation. The store first selects referencing group expenses from
hydrated Zustand state, then performs one atomic IndexedDB transaction:

1. Delete the tag record
2. Write the selected expense records with the tag ID removed from `tagIds[]`

The prepared expense records retain their other fields and are not deleted.

Atomicity covers these writes, not the completeness or freshness of the selected records. The
store does not query persisted expenses inside the transaction. If another tab or overlapping
mutation changes expenses after the snapshot, cleanup can miss new references or overwrite newer
expense data. See [[state-management]] for persistence boundaries.

---

## Contrast With Categories

Every expense must reference exactly one category, so deleting an in-use category is blocked. Tags are optional, so an in-use tag can be deleted safely as long as its optional references are removed atomically.

---

## Related

- [[domain-models]] — Tag shape and `Expense.tagIds[]`
- [[indexeddb-schema]] — tags table and expense references
- [[category-management]] — contrast with mandatory categories
- [[filtering]] — group tags as an expense filter
- [[state-management]] — hydrated-state selection versus transactional writes
