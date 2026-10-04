---
name: layout-architecture
description: Responsive mobile, tablet, and desktop shell and the components that implement it
metadata:
  type: architecture
---

# Layout Architecture

Purpose: document the implemented responsive shell and distinguish navigation stubs from working routes.

Last updated: 2026-10-05

## Viewport States

The app uses three viewport states from `useViewport`: mobile, tablet, and desktop. `AppLayout`
conditionally renders navigation chrome for each state, so the component tree differs by viewport.

### Mobile (< 768px)

Mobile renders the main route outlet and a fixed, context-aware footer. It does not render the
sidebar or activity panel.

There is no persistent top bar or app chrome header on mobile. The greeting belongs to dashboard
page content. The light/dark theme toggle is in Settings. See [[dashboard]] for details.
The dashboard-level Activity, Unsettled, Analytics, and app Settings pages keep their title and
subtitle visible while the main pane scrolls, including at the bottom. This is limited to mobile;
the desktop activity panel and page headers retain their existing scrolling behavior.

**Bottom nav** — fixed at the bottom of ordinary mobile app routes and context-aware; Add/Edit
Expense forms hide it to give the form focus:

| Context | Items |
|---------|-------|
| Home | Groups, Activity, New group, Unsettled, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |
| Add/Edit Expense | No bottom nav |

The centered New group footer action replaces the floating dashboard New group CTA on mobile; it
uses the same purple accent and opens `/groups/new`. The dashboard-level Activity, Unsettled, and
Settings destinations have footer links. Analytics retains its route, with a mobile Back to
dashboard link but no footer item. The dashboard's category preview links to it only at widths of
640px and above; at narrower mobile widths the preview is hidden, so there is currently no
dashboard link to Analytics. All five in-group footer destinations resolve to nested group-detail
routes. See [[dashboard]].
The group-context footer is unchanged; it has no New group action. Other route-specific floating
actions, such as Add expense and Add contact, are unaffected.
On mobile, non-form group headers include a Back to dashboard link above the group context. It
stays visible with the sticky header on Overview, Expenses, Members, Categories & Tags, Balances,
Settings, and expense detail. Expense forms keep their existing Back to expenses control, which
returns to a screen with the dashboard link. Desktop retains the sidebar All groups link instead.

**No sidebar.** Mobile navigation is handled by the context-aware bottom nav and route content;
there is no persistent top bar.

### Tablet (768px – 1079px)

- Two-pane layout: sidebar on left, main content on right
- No activity panel or stacked activity section is currently rendered
- No footer

### Desktop (1080px+)

- Three-pane layout on Dashboard and group screens other than Settings and expense forms: sidebar
  on left, main content in centre, activity panel on right
- Expense add/edit forms retain their focus mode without a sidebar but show group activity on the
  right; group Settings and unrelated screens do not show the activity panel
- No footer

The desktop activity panel shows saved action events from all groups on the dashboard, ordered
newest-first by recording time (`createdAt`) rather than expense occurrence (`when`). On a group's
routes it shows only that group's events, in the same order, with compact rows, except on group
Settings. Deleted-item rows remain visible without a link; older current expenses lacking a saved
creation event appear as derived entries. On the create-group route it is replaced by the live
group-draft preview. See [[dashboard]] and [[indexeddb-schema]].
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
styles intend that element to be the scroll container for ordinary routes. In the 2026-10-04
mobile browser run, a long Categories & Tags fixture also scrolled `window`, failing the test's
zero-window-scroll assertion. The actual scroll boundary in that case needs investigation; do not
assume `window` never scrolls on every mobile group route. See [[testing-strategy]].
Group headers remain sticky within that pane on all group routes, including forms and Settings.
Their mobile Back to dashboard link therefore stays reachable while scrolling non-form routes.
On desktop and tablet, Expenses, Members, and Categories & Tags fit the available viewport;
their lists or cards scroll independently only when needed. On mobile, Expenses instead scrolls
through the entire main pane to its last row, while the group header, expense title/subtitle, and
then the search/sort/filter toolbar stick in sequence. The insights banner scrolls away before the
toolbar sticks. Mobile Categories & Tags also scrolls the main pane: each card is 50vh tall with
only its content scrolling below a fixed-in-card title/subtitle/Add control, so rows cannot appear
above or behind the header; the page's own
Categories & Tags title sticks under the group header. Members remains viewport-bounded. Bounded
routes lock document-level overflow so the browser cannot scroll the entire app offscreen.
Expense sort/filter overlays remain portaled and scrollable outside the ledger.
Without an explicit reset, a new ordinary route inherits the previous page's position. A shared
`useScrollToTop` hook runs in the pathless root route layout, covering protected pages as well as
onboarding, import, and restore. It resets both `#main-content` and the window to the top when the
pathname changes, including browser Back/Forward; browser-native scroll restoration is disabled
while this layout is mounted. Query-string edits on the same page do not trigger a reset, preserving
the list's internal scroll position while filtering. See [[filtering]] and [[main-screen]].

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
2. **All groups** — returns to the dashboard groups list
3. **Current group summary** — non-clickable group icon/name/currency plus member and expense counts
4. **Group menu items** — Overview, Expenses, Members, Categories & Tags, Settings
5. **Profile link** — anchored at the bottom

The groups list and new-group action appear only on dashboard-context routes; inside any group the
sidebar instead shows the return link, current-group summary, and group navigation.
The redundant three-dot shortcut beside the group header's member avatars has been removed;
Settings remains reachable through the group sidebar or mobile footer.

### Context-aware menu items by route

| Route | Menu items |
|-------|-----------|
| Home (Dashboard) | Dashboard, Contacts, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |

---

## Group Item Component

Each group in the sidebar list is a self-contained component with:

- **Group icon** — saved PNG image key rendered as an avatar, with a local image fallback
- **Group name**
- **Member avatars** — up to three, followed by an overflow count
- **Expense count** — e.g. "21 expenses"
- **Net balance** — calculated from the local member's paid and owed transactions in the group

---

## Chrome Components

Route content is shared across viewport states. The navigation chrome differs:

- **Footer** — mobile only; route-aware, except on Add/Edit Expense forms
- **Sidebar** — tablet and desktop app routes, except Add/Edit Expense focus-mode forms
- **Activity panel** — desktop only (1080px+); Dashboard and non-Settings group routes show saved action events and legacy expense fallbacks; create-group shows its live preview

### Bottom nav behaviour by route (mobile)

| Route | Bottom nav items |
|-------|-----------------|
| Home | Groups, Activity, New group, Unsettled, Settings |
| Inside a group | Overview, Expenses, Members, Categories & Tags, Settings |
| Add/Edit Expense | No bottom nav |

All in-group destinations resolve to nested routes. Dashboard footer destinations also have routes,
though some screens are still lightweight. Analytics is a dashboard preview destination, not a
footer tab; see [[dashboard]].

---

## Expense Routes

Saved expense links open detail at `/groups/:groupId/expenses/:expenseId`; editing uses its `/edit`
path. The existing `/expenses/new` route remains creation. Balances is linked from the overview at
`/groups/:groupId/balances` rather than listed in the sidebar or footer.

## Related

- [[dashboard]] — dashboard main pane layout and sections
- [[main-screen]] — home screen layout and navigation
- [[state-management]] — store shape
