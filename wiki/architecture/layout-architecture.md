---
name: layout-architecture
description: Responsive mobile, tablet, and desktop shell and the components that implement it
metadata:
  type: architecture
---

# Layout Architecture

Purpose: document the implemented responsive shell and distinguish navigation stubs from working routes.

Last updated: 2026-10-01

## Viewport States

The app uses three viewport states from `useViewport`: mobile, tablet, and desktop. `AppLayout`
conditionally renders navigation chrome for each state, so the component tree differs by viewport.

### Mobile (< 768px)

Mobile renders the main route outlet and a fixed, context-aware footer. It does not render the
sidebar or activity panel.

There is no persistent top bar or app chrome header on mobile. The greeting belongs to dashboard
page content. The light/dark theme toggle is in Settings. See [[dashboard]] for details.

**Bottom nav** — always visible at the bottom; context-aware, changes items based on the current route:

| Context | Items |
|---------|-------|
| Home | Groups, Activity, Unsettled, Analytics, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

The dashboard-level Activity, Unsettled, Analytics, and Settings destinations have routes, although
some remain lightweight. All five in-group footer destinations resolve to nested group-detail routes.
There is no FAB; the New Group action lives inside the dashboard.

**No sidebar.** Mobile navigation is handled by the context-aware bottom nav and route content;
there is no persistent top bar.

### Tablet (768px – 1079px)

- Two-pane layout: sidebar on left, main content on right
- No activity panel or stacked activity section is currently rendered
- No footer

### Desktop (1080px+)

- Three-pane layout on Dashboard and Group Overview: sidebar on left, main content in centre,
  activity panel on right; other routes without a panel use two panes
- Activity panel is visible as a dedicated third column only on those two routes
- No footer

The desktop activity panel shows expenses from all groups on the dashboard, ordered newest-first
by recording time (`createdAt`) rather than the user-entered expense date (`when`). On a group's
Overview route it shows only expenses belonging to that group, in the same order,
with compact rows. It does not appear on the group's Expenses route. On the create-group route it is
replaced by the live group-draft preview; there is no separate persisted activity entity.
Its compact activity list is not wrapped in the shared `Surface`: the unlayered `.surface` rules
take precedence over Tailwind's layered `border-0` and `shadow-none` utilities, leaving an unwanted
card border/shadow around otherwise unpadded rows. The full Activity page still uses `Surface`.
Compact rows give the group name a separate wrapping line and keep the recording date/time visible
below it. Titles may use three lines and group names two. There is no activity-row tooltip.

## Feedback Banners

Import, restore, and export surfaces use the shared `StatusBanner` component and `status-banner`
styles. Errors use a red background, border, and alert icon with `role="alert"`; warnings use a
yellow background, border, and warning icon, distinct from neutral purple informational notes.
The tokens provide readable light- and dark-theme colors. A file opened in the wrong flow gets a
distinct button within the error banner that opens the correct flow. The general Back control on
the public restore route instead returns to the previous page. Standalone Import group and Restore
screens place quiet text-and-arrow Back controls above the page title, separate from file actions.
The import control returns to the app root; restore returns through browser history. The restore
confirmation gives the remaining countdown seconds bold emphasis. See [[full-backup]],
[[import-export]], and [[iconography]].

---

## Layout Mode Detection

A shared hook reads the window width and updates in real time whenever the viewport is resized. Components use it to make structural decisions — for example, whether to render the footer or the sidebar. Fine-grained stylistic differences within the desktop layout are handled with CSS responsive utilities.

---

## Route Scroll Position

The post-onboarding shell keeps `#main-content` mounted across route changes. Its `.app-main`
styles make that element the scroll container on desktop and mobile, separate from `window`.
Without an explicit reset, a new route inherits the previous page's position. A shared
`useScrollToTop` hook runs in the pathless root route layout, covering protected pages as well as
onboarding, import, and restore. It resets both `#main-content` and the window to the top when the
pathname changes, including browser Back/Forward; browser-native scroll restoration is disabled
while this layout is mounted. Query-string edits on the same page do not trigger a reset, preserving
the user's position while filtering the expense list. See [[filtering]] and [[main-screen]].

---

## Route Error Screen

The root data-router route supplies a custom `errorElement`, so unmatched URLs and errors from
onboarding, public import/restore, or protected app pages have a branded fallback instead of React
Router's developer-facing default. The fallback renders outside `AppLayout`, since the shell or a
child route may itself have failed. It distinguishes 404 pages from unexpected errors, offers a
home link through the normal onboarding guard, and offers a reload retry only for unexpected
errors. It reads the saved theme independently because the shell may not mount.

---

## Sidebar Structure

The sidebar is present on tablet and desktop routes rendered inside the post-onboarding
`AppLayout`. Onboarding routes use their own layout. Sidebar sections are route-context aware.

On dashboard routes, top to bottom:

1. **App logo** — always at the top
2. **Dashboard menu items** — Dashboard, Contacts, and Settings
3. **Groups list** — scrollable list of group item components
4. **Add new group link** — beside the groups-list heading
5. **Profile link** — anchored at the bottom

Inside a group, top to bottom:

1. **App logo** — always at the top
2. **Back to dashboard** — returns to the dashboard groups list
3. **Current group summary** — non-clickable group icon/name/currency plus member and expense counts
4. **Group menu items** — Overview, Expenses, Members, Categories & Tags, Settings
5. **Profile link** — anchored at the bottom

The groups list and new-group action appear only on dashboard-context routes; inside any group the
sidebar instead shows the return link, current-group summary, and group navigation.

### Context-aware menu items by route

| Route | Menu items |
|-------|-----------|
| Home (Dashboard) | Dashboard, Contacts, Settings |
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
- **Activity panel** — desktop only (1080px+); recorded expense activity except for the create-group live preview

### Bottom nav behaviour by route (mobile)

| Route | Bottom nav items |
|-------|-----------------|
| Home | Groups, Activity, Unsettled, Analytics, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

All in-group destinations resolve to nested routes. Dashboard footer destinations also have routes,
though some screens are still lightweight.

---

## Expense Routes

Saved expense links open detail at `/groups/:groupId/expenses/:expenseId`; editing uses its `/edit`
path. The existing `/expenses/new` route remains creation. Balances is linked from the overview at
`/groups/:groupId/balances` rather than listed in the sidebar or footer.

## Related

- [[dashboard]] — dashboard main pane layout and sections
- [[main-screen]] — home screen layout and navigation
- [[state-management]] — store shape
