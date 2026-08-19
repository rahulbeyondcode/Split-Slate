---
name: category-management
description: How categories are structured, selected at group creation, and managed over time
metadata:
  type: workflows
---

# Category Management

Last updated: 2026-08-20

## Implementation Status

The group **Categories & Tags** route currently implements category list/read, custom add, name/icon
edit, and guarded delete. Store guards enforce non-empty case-insensitively unique names, prevent
deleting an in-use category, and preserve at least one category per group. Group creation also
implements mandatory category selection with defaults.

Category deactivation is a future task. The `isActive` field and store update capability already
exist, but the management screen has no Activate/Deactivate control. This state is worth retaining
because a category may be referenced by historical expenses and therefore cannot be deleted, while
the user may no longer want it offered for new expenses. Deactivation will hide it from the future
new-expense picker without breaking its historical reference, and reactivation will make it
selectable again.

Expense-picker integration is also future work because there is no add/edit expense form yet. That
future picker must offer active categories, omit inactive categories for new selections, and still
resolve inactive categories on historical expenses.

## Two Levels of Categories

### App-Level Master List
The app ships with a curated master list of common categories, **each paired with a preset emoji
icon**. It is **seeded from a code constant on first launch into the `"categories"` row of the
`settings` store** (see [[indexeddb-schema]]) and is DB-backed. Its shape supports future editing,
but there is no settings UI or store action that persists master/default-list changes yet; see
[[category-settings-ui]]. A subset is the **default pre-selected set** for new groups.

Every category — master or custom — carries an emoji `icon`. Master entries use their preset icon; custom categories get an icon the user picks when creating them.

### Group-Level Categories
Each group has its own category list. These are the categories members actually pick from when adding expenses. They are group-scoped records in the `categories` table.

Group categories come from two sources:
1. **Selected from the master list** at group creation time
2. **Custom categories** added by any member at any point during expense tracking

---

## Group Creation Flow — Category Selection Step

After the group name/icon and currency are set, the creator is shown the master list with the **default set pre-selected**, and picks which categories apply to this group.

**The screen explains:**
> "Pick the categories that make sense for this group. You can always add more later."

- This step is **mandatory — at least one category must be selected.** Because `categoryId` is required on every expense, a group cannot be created with zero categories.
- The default set is pre-selected, so the step needs no effort unless the creator wants to change it; they can deselect, add custom categories, or both — as long as one remains.
- During onboarding, selected categories are instantiated when **Save and Proceed** is pressed. In
  the standalone create-group flow, all selected categories are written sequentially after the
  final **Create group** submission.

---

## Adding Categories After Group Creation

The group **Categories & Tags** screen can currently add a custom category through an **emoji +
name editor**, then edit or delete it subject to the rules below. Choosing an unselected entry from
the master list after group creation is not currently exposed as a separate UI.

---

## Category Rules

- Categories can be **renamed** at any time
- Category names are trimmed and case-insensitively unique within one group
- Categories are designed to be **deactivated** (hidden from the picker when adding expenses, while
  historical expenses keep their category reference intact); the model/store support this, but the
  management and picker UI are planned
- The planned deactivation UI also allows categories to be reactivated
- Categories can be **deleted only when no expense references them**. Because `categoryId` is mandatory and singular on every expense, a category that is in use cannot be deleted outright — the user must first **reassign every expense** carrying that category to a different category, after which the now-unreferenced category can be deleted. A category with zero referencing expenses (e.g. one just added during onboarding, or never used) can be deleted directly.
- A group must keep at least one category; the last remaining category cannot be deleted.
- Delete eligibility is checked before confirmation. In-use and last-category attempts show their blocking reason without a confirmation prompt; an eligible delete requires explicit irreversible-action confirmation.

**Delete vs deactivate:** deactivate when a category is still on historical expenses but you no longer want it offered for new entries; delete when you want it gone entirely and it is not referenced by any expense.

---

## Why This Design

- **No clutter:** Only relevant categories appear in the expense picker — not a huge undifferentiated list
- **No cold start:** The master list gives users something to pick from immediately without typing anything
- **Flexibility:** Custom categories and post-creation additions mean no group is ever constrained

---

## Related

- [[domain-models]] — Category shape (`id`, `groupId`, `name`, `icon`, `isActive`)
- [[indexeddb-schema]] — categories table, groupId index
- [[onboarding]] — category selection step in the group creation flow
