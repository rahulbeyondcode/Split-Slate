---
name: tag-management
description: How tags are created, renamed, and deleted within a group
metadata:
  type: workflows
---

# Tag Management

Last updated: 2026-06-03

## What Tags Are

Tags are optional, free-form labels that members can apply to expenses within a group. An expense can have zero or more tags alongside its single mandatory category. Tags are group-scoped — the same label in two groups is two separate tag records.

---

## Creating Tags

Tags can be created in two ways:

### Inline — During Expense Entry
The expense form includes a chip/combobox input for tags. When a member types a name that does not match any existing group tag, submitting the entry creates a new tag record and immediately applies it to the expense. Existing tags in the group are shown as suggestions as the user types.

### Dedicated Management Screen
The group tag management screen lets members create tags without opening an expense. This is also where rename and delete operations live.

---

## Renaming Tags

Any member can rename a tag at any time from the tag management screen. Because expenses reference tags by `tagId`, renaming a tag record is a single-table update — all expenses that carry that `tagId` automatically reflect the new name without any expense record changes.

---

## Deleting Tags

Tags can be deleted, unlike categories. Deletion is a two-step atomic operation:

1. Remove the tag record from the `tags` table
2. Remove that `tagId` from `tagIds[]` on every expense in the group that references it

Before deletion executes, the app shows a confirmation popup:

> "This tag will be removed from all X expense(s) it's on. The expenses themselves will not be affected."

The user must confirm. On confirmation both steps are committed in a single IndexedDB transaction — there is no intermediate state where the tag is gone but expenses still reference it.

**Why tags delete freely but categories don't:** `categoryId` is mandatory and singular on every expense, so an in-use category cannot simply be removed — it must have all referencing expenses reassigned first, and only then can the unreferenced category be deleted. `tagIds` is optional and multi-valued — removing a `tagId` from the array always leaves the expense fully valid, so a tag can be deleted at any time and the references cascade away. See [[category-management]].

---

## Key Invariant

After a tag deletion completes, no expense in the group may contain that `tagId` in its `tagIds[]` array. The delete and the cascade must be committed atomically.

---

## Related

- [[domain-models]] — Tag shape (`id`, `groupId`, `name`); `tagIds[]` field on Expense
- [[indexeddb-schema]] — tags table; tagIds in expenses table
- [[category-management]] — contrast: categories delete only when unreferenced (reassign first); tags delete freely with cascade
- [[filtering]] — tags as a filterable field on the expense list
