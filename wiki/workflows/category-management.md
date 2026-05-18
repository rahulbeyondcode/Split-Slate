---
name: category-management
description: How categories are structured, selected at group creation, and managed over time
metadata:
  type: workflows
---

# Category Management

Last updated: 2026-05-18

## Two Levels of Categories

### App-Level Master List
The app ships with a curated list of common categories (specific names TBD — to be decided before first build). These are read-only templates built into the app — not stored in IndexedDB, not editable by users.

### Group-Level Categories
Each group has its own category list. These are the categories members actually pick from when adding expenses. They are group-scoped records in the `categories` table.

Group categories come from two sources:
1. **Selected from the master list** at group creation time
2. **Custom categories** added by any member at any point during expense tracking

---

## Group Creation Flow — Category Selection Step

After the group name/icon and currency are set, the creator is shown the app master list and asked to pick which categories apply to this group.

**The screen explains:**
> "Choose the categories that make sense for this group. You'll pick from these when adding expenses — keeping the list short means faster entry. You can always add more categories later."

- This step is **skippable** — same pattern as the add-members step
- If skipped: the group starts with no categories; the creator or any member can add them later
- Selected categories are instantiated as group-scoped `Category` records at the moment of selection

---

## Adding Categories After Group Creation

Any member can add a new category to a group at any time — either from the master list (if any were skipped at creation) or as a completely custom category with a name they type in.

---

## Category Rules

- Categories can be **renamed** at any time
- Categories can be **deactivated** (hidden from the picker when adding expenses, but historical expenses keep their category reference intact)
- Categories can **never be deleted** — deleting would corrupt expense records that reference the category ID
- Deactivated categories can be reactivated at any time

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
