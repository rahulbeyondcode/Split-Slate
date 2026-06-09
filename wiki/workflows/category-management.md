---
name: category-management
description: How categories are structured, selected at group creation, and managed over time
metadata:
  type: workflows
---

# Category Management

Last updated: 2026-06-10

## Two Levels of Categories

### App-Level Master List
The app ships with a curated master list of common categories, **each paired with a preset emoji icon**. It is **seeded from a code constant on first launch into the `"categories"` row of the `settings` store** (see [[indexeddb-schema]]) and is DB-backed and user-editable thereafter (editing UI still TODO — see [[category-settings-ui]]). A subset of the master list is marked as the **default pre-selected set** for new groups.

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
- Selected categories are instantiated as group-scoped `Category` records when the step's **Save and Proceed** is pressed (not on each toggle).

---

## Adding Categories After Group Creation

Any member can add a new category to a group at any time — either from the master list (those not selected at creation) or as a completely custom category, entered through an **emoji + name editor** (pick an icon, type a name). The same editor is used in the onboarding category step.

---

## Category Rules

- Categories can be **renamed** at any time
- Categories can be **deactivated** (hidden from the picker when adding expenses, but historical expenses keep their category reference intact)
- Deactivated categories can be reactivated at any time
- Categories can be **deleted only when no expense references them**. Because `categoryId` is mandatory and singular on every expense, a category that is in use cannot be deleted outright — the user must first **reassign every expense** carrying that category to a different category, after which the now-unreferenced category can be deleted. A category with zero referencing expenses (e.g. one just added during onboarding, or never used) can be deleted directly.

**Delete vs deactivate:** deactivate when a category is still on historical expenses but you no longer want it offered for new entries; delete when you want it gone entirely and it is not referenced by any expense.

---

## Why This Design

- **No clutter:** Only relevant categories appear in the expense picker — not a huge undifferentiated list
- **No cold start:** The master list gives users something to pick from immediately without typing anything
- **Flexibility:** Custom categories and post-creation additions mean no group is ever constrained

---

## Related

- [[domain-models]] — Category shape (`id`, `groupId`, `name`, `isActive`)
- [[indexeddb-schema]] — categories table, groupId index
- [[onboarding]] — category selection step in the group creation flow
