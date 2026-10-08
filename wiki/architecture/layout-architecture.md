---
name: layout-architecture
description: Responsive mobile, tablet, and desktop shell and the components that implement it
metadata:
  type: architecture
---

# Layout Architecture

Purpose: document the implemented responsive shell and distinguish navigation stubs from working routes.

Last updated: 2026-10-09

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
Settings destinations have footer links. App-wide Analytics retains `/analytics`, with a mobile
Back to dashboard link but no footer item. The dashboard's category preview links to it only at
widths of 640px and above; at narrower mobile widths the preview is hidden, so there is currently
no dashboard link to app-wide Analytics. Group Overview has a category preview at every width;
`/groups/:groupId/analytics` retains the group shell without adding a second page's top padding.
Its rounded secondary Back button follows in-app history or falls back to the group Overview for
direct visits. Balances uses the same rounded secondary styling with its own navigation behavior.
Import/Restore also have rounded text-and-arrow controls, but link to guarded home (`/`) rather
than browser history. App-wide Analytics uses the original plain Back to dashboard link on mobile
instead.
All five in-group footer destinations resolve to nested group-detail routes. See [[dashboard]].
The group-context footer is unchanged; it has no New group action. Other route-specific floating
actions, such as Add expense and Add contact, are unaffected.
On mobile, non-form group headers include the original full-width, plain text-and-arrow Back to
dashboard link on its own line above the group context. It
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
Settings. Individual deleted-item rows remain visible without a link until the whole group is
deleted, when only its group-created/deleted rows remain. Older current expenses lacking a saved
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
distinct button within the error banner that opens the correct flow. Standalone Import group and
Restore screens both place a rounded text-and-arrow **Back to SplitSlate** link above the page title,
separate from file actions. Both link to `/`, not browser history. The existing onboarding guard
sends completed users to the dashboard and new/incomplete users to onboarding or resumable setup.
The restore
confirmation gives the remaining countdown seconds bold emphasis. See [[full-backup]],
[[import-export]], and [[iconography]].

---

## Saved Theme Initialization

`App` reads `split-slate-theme` and sets the HTML `data-theme` attribute in a layout effect before
paint, outside the protected app shell. Direct visits and reloads of onboarding, setup, Import,
Restore, and protected routes therefore apply the saved preference. Only `dark` selects dark
mode; missing or other values select light mode. Settings and a successful full-backup restore
still update both storage and the HTML attribute when the preference changes. The route-error
screen retains its independent saved-theme initialization. See [[testing-strategy]] and [[full-backup]].

## Layout Mode Detection

A shared hook reads the window width and updates in real time whenever the viewport is resized. Components use it to make structural decisions — for example, whether to render the footer or the sidebar. Fine-grained stylistic differences within the desktop layout are handled with CSS responsive utilities.

## Narrow-Mobile Root Scaling

`App` initializes `useRootFontSize` before paint. The hook reads the CSS layout viewport width
(`window.innerWidth`), updates on resize, and publishes `--app-font-scale` on the HTML element.
The HTML font size is the 16px reference root multiplied by this scale:

| Viewport width | HTML root size |
|----------------|----------------|
| 400px and above | 16px; no scaling |
| Between 360px and 400px | Linear interpolation from 14px to 16px |
| 360px and below | 14px minimum |

Widths are not physical display pixels or phone-model identifiers. Existing mobile/tablet/desktop
navigation breakpoints remain unchanged; a 425px phone is within the unscaled mobile range.

Explicit app font sizes and custom component sizing/spacing use rem equivalents of their previous
pixel values, with 16px as the conversion reference. For example, body text remains 14px at the
baseline (`0.875rem`) and becomes 13.5625px at a 390px viewport whose root is 15.5px. Tailwind's
existing rem typography, spacing, radii, and dimensions follow the same root. In fluid font clamps,
the preferred viewport-width term is multiplied by the same scale so it cannot bypass the root.

Viewport/percentage sizing, responsive breakpoints, safe-area insets, border thickness, outlines,
shadows, animation offsets, and explicit SVG pixel sizes are not converted into proportional rem
dimensions. Text wrapping and intrinsic container heights can still change with available space.

A source-level comparison confirmed baseline CSS equivalence at a 16px root, excluding separately
approved prerequisite layout fixes. The post-scaling full browser run completed with seven failures;
all seven passed focused checks after the theme, modal-focus, and resize-assertion corrections.
Final responsive captures confirm saved themes and no horizontal overflow. Physical-device
behavior and a single full-suite run after those corrections remain unverified. See
[[testing-strategy]] and [[main-screen]].

---

## Route Scroll Position

The post-onboarding shell keeps `#main-content` mounted across route changes. Its `.app-main`
styles make that element the scroll container for ordinary routes. On mobile Categories & Tags,
document and shell overflow are clipped and the body is fixed so only `#main-content` scrolls between the two sections;
the card interiors scroll separately. See [[testing-strategy]].
Group headers remain sticky within that pane on all group routes, including forms and Settings.
Their mobile Back to dashboard link therefore stays reachable while scrolling non-form routes.
Mobile Add/Edit Expense forms hide the footer and use `#main-content` as their sole intended scroll
container: the body is fixed, document/shell overflow is clipped, and the main pane does not reserve
footer padding. Before root scaling, the 2026-10-08 browser suite verified the last split row,
Save/Cancel toolbar, and absence of a second document/form scroll area at 320px by 700px.
Post-scaling device validation remains pending; see [[main-screen]] and [[testing-strategy]].
Expenses scrolls the main pane on all viewport sizes: the group header, expense title/subtitle,
and then the search/sort/filter toolbar stick in sequence, while insights scroll away. On tablet
and desktop the ledger itself has a second scroll area sized to its first ten rendered entries
(including payment rows), allowing entries of different heights; shorter lists take only their
natural height. On mobile the ledger has no internal scroll and the main pane reaches its last row.
Mobile Categories & Tags also scrolls the main pane: each card is 50vh tall with only its content
scrolling below its section title/subtitle/Add control, so rows cannot appear above or behind
the sticky group header. The duplicate visible Categories & Tags page title is omitted. Members remains
viewport-bounded. Bounded
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
though some screens are still lightweight. App-wide and group-scoped Analytics are preview
destinations, not footer tabs; see [[dashboard]] and [[main-screen]].

---

## Expense Routes

Saved expense links open detail at `/groups/:groupId/expenses/:expenseId`; editing uses its `/edit`
path. The existing `/expenses/new` route remains creation. Balances is linked from the overview at
`/groups/:groupId/balances` rather than listed in the sidebar or footer.

## Related

- [[dashboard]] — dashboard main pane layout and sections
- [[main-screen]] — home screen layout and navigation
- [[state-management]] — store shape
