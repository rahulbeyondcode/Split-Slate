---
name: tag-management
description: How expense-local tag labels work
metadata:
  type: workflows
---

# Tag Management

Last updated: 2026-08-11

## What Tags Are

Tags are optional, free-form labels stored directly on an expense. An expense can have zero or more tags alongside its single mandatory category.

Tags are **not permanent entities** and there is no group-level tag registry/table. A tag label exists because one or more expenses currently carry that string.

## Expense Rules

- Tags are optional; an expense may have an empty `tags` array
- Tags are plain strings stored on `Expense.tags`
- The same expense cannot contain the same tag label more than once
- The same label may appear on many expenses
- Adding, editing, or deleting tags happens by editing an expense's tag list

---

## Group Categories & Tags Screen

The group Categories & Tags screen shows tag labels currently used by expenses in the group. Deleting a tag label from this screen removes that label from every expense in the group that currently carries it. The expenses themselves remain valid.

There is no durable tag record to delete; the operation rewrites matching expense `tags` arrays.

---

## Contrast With Categories

Categories are durable group records and every expense must reference exactly one `categoryId`. Tags are optional labels stored on the expense itself.

Category deletion is blocked while any expense references that category. Tag deletion is simpler: removing a tag label from a group removes only that label from matching expenses.

---

## Related

- [[domain-models]] — `tags: string[]` field on Expense
- [[indexeddb-schema]] — tags stored inside expense records
- [[category-management]] — contrast: categories are durable group records
- [[filtering]] — tag labels as a filterable field on the expense list
