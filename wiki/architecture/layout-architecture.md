---
name: layout-architecture
description: Responsive mobile, tablet, and desktop shell and the components that implement it
metadata:
  type: architecture
---

# Layout Architecture

Last updated: 2026-08-20

## Viewport States

The app uses three viewport states from `useViewport`: mobile, tablet, and desktop. `AppLayout`
conditionally renders navigation chrome for each state, so the component tree differs by viewport.

### Mobile (< 768px)

Mobile renders the main route outlet and a fixed, context-aware footer. It does not render the
sidebar or activity panel.

There is no persistent top bar or app chrome header on mobile. The greeting and theme toggle are dashboard page content, not chrome — see [[dashboard]] for details.

**Bottom nav** — always visible at the bottom; context-aware, changes items based on the current route:

| Context | Items |
|---------|-------|
| Home | Groups, Activity, Unsettled, Analytics, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

The Groups destination works. The dashboard-level Activity, Unsettled, Analytics, and Settings
destinations are navigation stubs whose routes have not been registered. All five in-group footer
destinations resolve to nested group-detail routes, although several screens remain lightweight.
There is no FAB; the New Group action lives inside the dashboard.

**No sidebar.** Mobile navigation is handled by the context-aware bottom nav and route content;
there is no persistent top bar.

### Tablet (768px – 1079px)

- Two-pane layout: sidebar on left, main content on right
- No activity panel or stacked activity section is currently rendered
- No footer

### Desktop (1080px+)

- Three-pane layout: sidebar on left, main content in centre, activity panel on right
- Activity panel is visible as a dedicated third column
- No footer

The desktop activity panel currently shows hardcoded sample activity. On the create-group route it
is replaced by the live group-draft preview. The matcher anticipates a future edit route, but the
router does not register one. A real activity data model/feed has not been implemented.

---

## Layout Mode Detection

A shared hook reads the window width and updates in real time whenever the viewport is resized. Components use it to make structural decisions — for example, whether to render the footer or the sidebar. Fine-grained stylistic differences within the desktop layout are handled with CSS responsive utilities.

---

## Sidebar Structure

The sidebar is present on tablet and desktop routes rendered inside the post-onboarding
`AppLayout`. Onboarding routes use their own layout. Sidebar sections are route-context aware.

On dashboard routes, top to bottom:

1. **App logo** — always at the top
2. **Dashboard menu items** — Dashboard and All Friends
3. **Groups list** — scrollable list of group item components
4. **Add new group link** — beside the groups-list heading
5. **Profile + settings icon** — always at the bottom

Inside a group, top to bottom:

1. **App logo** — always at the top
2. **Back to dashboard** — returns to the dashboard groups list
3. **Current group summary** — non-clickable group icon/name/currency plus member and expense counts
4. **Group menu items** — Overview, Expenses, Members, Categories & Tags, Settings
5. **Profile + settings icon** — always at the bottom

All groups are not listed while inside a group; the sidebar focuses on the active group context.

### Context-aware menu items by route

| Route | Menu items |
|-------|-----------|
| Home (Dashboard) | Dashboard, All Friends |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

---

## Group Item Component

Each group in the sidebar list is a self-contained component with:

- **Group icon** — emoji or letter avatar
- **Group name**
- **Member avatars** — up to three, followed by an overflow count
- **Expense count** — e.g. "21 expenses"
- **Net balance** — calculated from the local member's paid and owed transactions in the group

---

## Chrome Components

Route content is shared across viewport states. The navigation chrome differs:

- **Footer** — mobile only; route-aware; switches its content based on the current path
- **Sidebar** — tablet and desktop only; always visible
- **Activity panel** — desktop only (1080px+); currently sample data except for the create-group live preview

### Bottom nav behaviour by route (mobile)

| Route | Bottom nav items |
|-------|-----------------|
| Home | Groups, Activity, Unsettled, Analytics, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

All in-group destinations resolve to nested routes. On the dashboard footer, only Groups resolves;
Activity, Unsettled, Analytics, and Settings still lead to unmatched routes.

---

## Related

- [[dashboard]] — dashboard main pane layout and sections
- [[main-screen]] — home screen layout and navigation
- [[state-management]] — store shape
