---
name: layout-architecture
description: Two-mode responsive layout system — mobile vs desktop — and the components that implement it
metadata:
  type: architecture
---

# Layout Architecture

Last updated: 2026-06-05

## Two Layout Modes

The app has exactly two layout modes. Tablet and desktop are unified into one mode; differences between them are handled with CSS only.

### Mobile (< 768px)

Mobile is the primary surface — no features are dropped relative to desktop. The same content is reorganised to fit a single-column layout.

There is no persistent top bar or app chrome header on mobile. The greeting and theme toggle are dashboard page content, not chrome — see [[dashboard]] for details.

**Bottom nav** — always visible at the bottom; context-aware, changes items based on the current route:

| Context | Items |
|---------|-------|
| Home | Groups, Activity, Unsettled, Analytics, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

Each bottom nav item replaces the full-screen content area with its corresponding view. There is no FAB — the Add New Group button lives inside the Groups view, in context with the groups list.

**No sidebar.** All navigation that lives in the sidebar on desktop is handled by the top bar and bottom nav on mobile.

### Tablet (768px – 1079px)

- Two-pane layout: sidebar on left, main content on right
- Activity section appears stacked below main content in the right pane, under an explicit "Activity" heading — not a separate third column
- No footer

### Desktop (1080px+)

- Three-pane layout: sidebar on left, main content in centre, activity panel on right
- Activity panel is always visible as a dedicated third column
- No footer

Differences between tablet and desktop (activity panel becoming a separate column, sidebar width, grid density) are handled entirely with CSS — the component tree is identical at both sizes.

---

## Layout Mode Detection

A shared hook reads the window width and updates in real time whenever the viewport is resized. Components use it to make structural decisions — for example, whether to render the footer or the sidebar. Fine-grained stylistic differences within the desktop layout are handled with CSS responsive utilities.

---

## Sidebar Structure

The sidebar is present on all tablet and desktop routes. Its sections, top to bottom:

1. **App logo** — always at the top
2. **Context-aware menu items** — change based on the current route (see below)
3. **Groups list** — scrollable list of group item components
4. **Add new group button** — below the groups list
5. **Profile + settings icon** — always at the bottom

### Context-aware menu items by route

| Route | Menu items |
|-------|-----------|
| Home (Dashboard) | Dashboard |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

---

## Group Item Component

Each group in the sidebar list is a self-contained component with:

- **Group icon** — emoji or letter avatar
- **Group name**
- **Net balance** — positive (green) means the user is owed money; negative (red) means the user owes money
- **Member count** — e.g. "10 members"
- **Expense count** — e.g. "21 expenses"

---

## Chrome Components

All content components (cards, expense rows, etc.) are identical across both modes. Only the navigation chrome differs:

- **Footer** — mobile only; route-aware; switches its content based on the current path
- **Sidebar** — tablet and desktop only; always visible
- **Activity panel** — desktop only (1080px+); on tablet, activity content is stacked below main content

### Bottom nav behaviour by route (mobile)

| Route | Bottom nav items |
|-------|-----------------|
| Home | Groups, Activity, Unsettled, Analytics, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

---

## Related

- [[dashboard]] — dashboard main pane layout and sections
- [[main-screen]] — home screen layout and navigation
- [[state-management]] — store shape
