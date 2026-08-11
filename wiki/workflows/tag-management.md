---
name: tag-management
description: How group-scoped tags are created, renamed, linked to expenses, and deleted
metadata:
  type: workflows
---

# Tag Management

Last updated: 2026-08-12

## What Tags Are

Tags are durable, free-form records scoped to one group. The same tag cannot be reused across groups; two groups may independently create tags with the same name.

Expenses optionally reference tags through `tagIds[]`. An expense may have no tags, and removing every tag reference leaves the expense valid.

Tag names are trimmed and case-insensitively unique within a group. Every tag also has a required six-digit hex color used as its visual identifier.

## Creating and Renaming Tags

Tags can be created from the group's **Categories & Tags** screen by entering a name and choosing a color. The reusable color picker offers 10 named presets (stored as hex values) plus synchronized custom native-picker and manual hex-code controls. Valid output is always a six-digit hex code. Inline creation during expense entry will use the same group tag pool when the expense form is implemented.

Editing a tag can change its name, color, or both. Because expenses reference the tag by ID, every referencing expense automatically displays the updated tag.

---

## Group Categories & Tags Screen

The group **Categories & Tags** screen lists every tag record in the group, including tags not currently used by an expense. It supports add, rename, and delete operations.

Deleting a tag requires confirmation and performs one atomic IndexedDB transaction:

1. Delete the tag record
2. Remove its ID from `tagIds[]` on every referencing expense in that group

The expenses themselves are not deleted or otherwise changed.

---

## Contrast With Categories

Every expense must reference exactly one category, so deleting an in-use category is blocked. Tags are optional, so an in-use tag can be deleted safely as long as its optional references are removed atomically.

---

## Related

- [[domain-models]] — Tag shape and `Expense.tagIds[]`
- [[indexeddb-schema]] — tags table and expense references
- [[category-management]] — contrast with mandatory categories
- [[filtering]] — group tags as an expense filter
