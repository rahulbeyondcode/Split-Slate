---
name: category-management
description: How categories are structured, selected at group creation, and managed over time
metadata:
  type: workflows
---

# Category Management

Purpose: explain group-category selection, editing, guarded deletion, and pending activation UI.

Last updated: 2026-10-08

## Implementation Status

The group **Categories & Tags** route currently implements category list/read, custom add, name/icon
edit, and guarded delete. Store guards enforce non-empty case-insensitively unique names, prevent
deleting an in-use category, and preserve at least one category per group. Group creation also
implements mandatory category selection with defaults.
On mobile the main pane scrolls between sections without scrolling the browser window, while the
category card itself is 50vh tall and scrolls independently. Categories title, available count,
and the dark Add category button are above the card, not sticky within it; the shared group Back
header remains sticky. The duplicate visible Categories & Tags page title is omitted. Each
category shows its full, wrapping name without an inline expense count above a second row of
wide, softly rectangular Edit/Delete buttons. Blocked deletion keeps the usage count in its
explanation modal instead. Add and Edit open a name/icon modal at every width rather than expanding
the card inline; validation and save errors remain in the modal, and Cancel/Escape dismiss it
without saving. Tablet stacks Categories above Tags; desktop keeps the bounded cards side by side.
At laptop widths, short category names share a row with Edit/Delete, while long names wrap and
move the actions below.

Category deactivation is a future task. The `isActive` field and store update capability already
exist, but the management screen has no Activate/Deactivate control. This state is worth retaining
because a category may be referenced by historical expenses and therefore cannot be deleted, while
the user may no longer want it offered for new expenses. The new-expense picker already omits
inactive records without breaking historical references; reactivation makes them selectable again.

The new-expense picker offers active categories only, and the save transaction rechecks category
activity and group ownership. Historical list/overview rows still resolve inactive category names.
The expense form can create a group category without navigating away, including when no active
category exists; the newly created category is selected and existing expense entries are preserved.
On expense detail, the current category opens a popover of active group categories (plus the
current one if inactive). Selecting another category saves immediately through a focused expense
reference update; invalid or cross-group choices fail without changing the expense. The full
expense editor remains available. See [[expense-edit-delete]].

## Two Levels of Categories

### App-Level Master List
The app ships with a curated master list of common categories, **each paired with a preset PNG image
key**. It is **seeded from a code constant on first launch into the `"categories"` row of the
`settings` store** (see [[indexeddb-schema]]) and is DB-backed. Its shape supports future editing,
but there is no settings UI or store action that persists master/default-list changes yet; see
[[category-settings-ui]]. A subset is the **default pre-selected set** for new groups.

Every category — master or custom — carries an `icon` image key. Master entries use their preset
key; custom categories use a locally available image selected in the picker. Legacy saved category
emoji may still resolve to matching images without rewriting their stored values. See [[iconography]].

### Group-Level Categories
Each group has its own category list. These are the categories members actually pick from when adding expenses. They are group-scoped records in the `categories` table.

When adding a category in group management, expense entry, onboarding, or standalone group
creation, typing even one letter offers names used in other groups. Matches may occur anywhere in
the name and ignore case, spaces, hyphens, and underscores: `fuel` finds `Expense_of_fuel`, and
`petrol_expense` finds `Petrol Expense`. Each suggestion shows its source icon and all source group
names; a same-name/different-icon variant is shown separately. Choosing it copies its exact name
and icon into a **new group-owned category**, not the source category ID. The source category and
other groups' expenses are unchanged. Names already present in the destination group are excluded.
The onboarding and new-group forms keep this choice in their draft until their usual save step.
App-wide category spending combines exact matching names from existing groups in the same currency;
different spelling or capitalization still forms separate totals. See [[dashboard]].

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
- Both flows open **Add new category** in the shared name/icon modal at every width. Validation
  and cross-group suggestions stay inside the dialog. Add or a suggestion adds a selected draft
  category and closes the dialog; Cancel/Escape changes neither the draft nor IndexedDB. Closing
  returns focus to Add new category.

---

## Adding Categories After Group Creation

The group **Categories & Tags** screen can currently add a custom category through a name field
followed by a wrapping image picker, matching the onboarding category modal. The same fields
support editing the name and icon; these forms open in a modal at every width, not inline.
Deletion remains subject to the rules below. The former
side-by-side layout squeezed the name input beside the full emoji grid in narrow columns. Choosing
an unselected entry from the master list after group creation is not currently exposed as a
separate UI.

The Add new category control in the expense category picker opens a separate name/icon form. Saving
creates an active group category and selects it on the unfinished expense; cancelling leaves the
expense unchanged. Duplicate names, including names of inactive categories, are rejected.

---

## Category Rules

- Categories can be **renamed** at any time
- Category names are trimmed and case-insensitively unique within one group
- Categories are designed to be **deactivated** (hidden from the picker when adding expenses, while
  historical expenses keep their category reference intact); the model/store support this, but the
  management toggle is planned and the new-expense picker already honors the flag
- The planned deactivation UI also allows categories to be reactivated
- Categories can be **deleted only when no expense references them**. Because `categoryId` is mandatory and singular on every expense, a category that is in use cannot be deleted outright — the user must first **reassign every expense** carrying that category to a different category, after which the now-unreferenced category can be deleted. A category with zero referencing expenses (e.g. one just added during onboarding, or never used) can be deleted directly.
- A group must keep at least one category; the last remaining category cannot be deleted.
- Delete eligibility is checked before confirmation. In-use and last-category attempts show their blocking reason without a confirmation dialog; an eligible delete requires explicit irreversible-action confirmation in the shared in-app modal. See [[confirmation-dialogs]].

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
