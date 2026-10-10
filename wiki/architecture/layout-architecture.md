---
name: layout-architecture
description: Responsive mobile, tablet, and desktop shell and the components that implement it
metadata:
  type: architecture
---

# Layout Architecture

Purpose: document the implemented responsive shell and distinguish navigation stubs from working routes.

Last updated: 2026-10-11

## Viewport States

The app uses three viewport states from `useViewport`: mobile, tablet, and desktop. `AppLayout`
conditionally renders navigation chrome for each state, so the component tree differs by viewport.

### Mobile (< 768px)

Mobile renders the main route outlet and a fixed, context-aware footer. It does not render the
sidebar or activity panel.

There is no persistent top bar or app chrome header on mobile. The greeting belongs to dashboard
page content. The light/dark theme toggle is in Settings. See [[dashboard]] for details.
On mobile, dashboard-level Activity and app Settings keep their title and subtitle visible while
the main pane scrolls. App-wide Analytics and Unsettled keep their Back button and title visible
at every width, while the subtitle and remaining content scroll in the main pane. The desktop
activity panel retains its independent scrolling behavior.

**Bottom nav** — fixed at the bottom of ordinary mobile app routes and context-aware; Add/Edit
Expense forms hide it to give the form focus:

| Context | Items |
|---------|-------|
| Dashboard context, primary row | Groups, Activity, New group, Unsettled, More / Close |
| Dashboard context, expanded upper row | Contacts, Analytics, Import, Restore, Settings |
| Inside a group, primary row | Overview, Expenses, Add, Members, More / Close |
| Inside a group, expanded upper row | Balances, Analytics, Activity, Cats & Tags, Settings |
| Add/Edit Expense | No bottom nav |

Both footer contexts expand upward when More is pressed. The primary row stays anchored at the
bottom; More becomes Close in the same bottom-right position. The additional row uses a 320ms
eased height transition and staggered icon fade/slide/scale; closing uses a faster 200ms collapse.
The More/Close glyphs crossfade and rotate. There is no separate sheet or overlay.

The purple centered Add action opens `/groups/:groupId/expenses/new`, preserving the current query
string for returning to filtered Expenses. It replaces the floating mobile Add expense control
and is available on every ordinary group route, including Analytics, Settings, and expense detail.
This removes route-dependent creation access without adding a sixth primary slot. Add/Edit Expense
forms still hide the entire footer. Desktop/tablet creation actions and sidebar navigation are
unchanged; all new navigation styles are scoped below 768px.

Selecting any footer destination collapses the row. `AppLayout` keys the footer by pathname so
route, history, and group changes reset expansion; leaving mobile also unmounts it. More remains
highlighted when the current route belongs to the upper row. Closed links are inert and hidden
from assistive technology; the toggle exposes `aria-expanded`/`aria-controls`, and Escape within
the footer closes it and returns focus to the toggle. Both footer contexts have a minimum 48px
control height. Safe-area-aware reserved main-pane padding grows with expansion; bounded Members height
uses the same reservation so its controls remain reachable above the footer.

`src/app/tests/router/mobile-navigation.e2e.ts` adds interaction, route/history, form hiding,
keyboard, theme, 280–767px layout, last-ledger-row clearance, and tablet/desktop regression cases.
Dashboard cases additionally cover every More route, public Import/Restore entry without data
changes, mobile Contacts access, creation-action centering, and dashboard content clearance at
280–767px in both themes. Existing overview, filter, category-breakdown, and dashboard expectations
now use the primary/More split. These pass in the stable 2026-10-11 full browser suite: 520 passes,
44 expected viewport-specific skips, and zero failures. The history test waits for the destination
link's active-page state before another action because local link-click collapse does not prove
the route has committed; every reset assertion remains intact. See [[testing-strategy]].

The centered New group footer action replaces the floating dashboard New group CTA on mobile; it
uses the same purple accent as group Add and opens `/groups/new`. The dashboard-context footer
is shared by Dashboard, Activity, app-wide Analytics, Unsettled, Contacts, app Settings, and New
group. Activity and Unsettled stay in its primary row. More exposes Contacts (`/friends`), app-wide
Analytics (`/analytics`), Import (`/import`), Restore (`/restore`), and app Settings (`/settings`).
Contacts and Analytics no longer depend on sidebar visibility or populated spending previews for
mobile access. Import/Restore remain public standalone screens outside `AppLayout`, so selecting
them leaves the navbar; their existing Back to SplitSlate link returns through guarded home.
Opening those routes does not import or replace data: their existing review/confirmation flows
are unchanged. On Contacts, the existing floating New contact action moves above the taller navbar
while More is expanded and returns to its usual position after collapse. Below 768px, its header
New contact action uses an important hiding utility because the unlayered `.btn` display rule
otherwise overrides Tailwind's layered utility; only the floating action is exposed. Tablet and
desktop retain their header action. A regression covers one accessible mobile action, clearance
above expanded More, and cancellation focus at 280, 390, 640, and 767px.

When groups exist, the dashboard's Unsettled balances and category
previews stack beneath its group list at every mobile width, including with a single group. The
category preview requires a shared currency; its heading, View all action, and rows link to
app-wide Analytics without changing the footer. Revised mobile coverage passes in the final
2026-10-11 full browser suite.
See [[dashboard]] for the historical hiding rules and their approved removal.
Group Overview has a category preview at every width;
`/groups/:groupId/analytics` retains the group shell without adding a second page's top padding.
Its rounded secondary Back button follows in-app history or falls back to the group Overview for
direct visits. Balances uses the same rounded secondary styling with its own navigation behavior.
Import/Restore also have rounded text-and-arrow controls, but link to guarded home (`/`) rather
than browser history. App-wide Analytics and Unsettled use rounded Back buttons at every width:
they follow in-app history or open Dashboard when entered directly.
All in-group footer links resolve to nested group-detail routes. See [[main-screen]].
The group-context footer has no New group action. Contact creation behavior is unchanged; its
floating action uses the expanded-dashboard clearance described above. The floating Add expense
action has been removed in favor of the centered group-navbar Add action.
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

Tablet sidebars show Activity because there is no activity panel: the app-level sidebar links to
`/activity` for changes across groups, and the group sidebar links to
`/groups/:groupId/activity` for events from that group only. The active route is highlighted in
the sidebar. Mobile has no sidebar; desktop keeps the activity panel and does not show these
sidebar links.

The shared group sidebar links to that group's Balances page from every group screen where the
sidebar is rendered. It is not an app-wide balances destination and is not added to the dashboard
sidebar. The mobile group footer now exposes the same group-scoped destination through More.

### Desktop (1080px+)

- Three-pane layout on Dashboard, app-wide Analytics and Unsettled, and group screens other than
  Settings and expense forms: sidebar on left, main content in centre, activity panel on right
- Expense add/edit forms retain their focus mode without a sidebar but show group activity on the
  right; group Settings and other app-wide screens do not show the activity panel
- Direct entry to `/groups/:groupId/activity` renders its group-scoped page without duplicating the
  feed in the right activity panel; the tablet-only sidebar link remains hidden on desktop
- No footer

The desktop activity panel shows saved action events from all groups on Dashboard, app-wide
Analytics, and Unsettled, ordered newest-first by recording time (`createdAt`) rather than expense
occurrence (`when`). On a group's
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

## App-Wide Modal Layout

Every current native modal uses the shared `.app-dialog` container and `DialogLayout` from
`src/shared/ui/dialog-layout/index.tsx`. This applies to setup/person/category/tag editors,
mobile Filters, destructive confirmations, blocked-removal explanations, group name/icon editing,
currency selection and confirmation, payment forms, import identity resolution, export notices,
backup restore, restore choices, and the PWA install prompt. Remaining inline forms and
desktop/tablet filter popovers are not modals and retain
their own layouts. See [[confirmation-dialogs]], [[filtering]], and [[full-backup]].

- The modal border stays at least 16 CSS pixels from every visible viewport edge. Safe-area insets
  can increase this clearance; it is a viewport constraint, independent of root-font scaling.
- The shared header contains the title and an explicit close control. The action footer is outside
  the scrolling body; neither header nor footer shrinks or scrolls with the content.
- Only `.dialog-body` scrolls. Errors, suggestions, form fields, and lengthy explanations belong
  there. Forms use `.dialog-form` so submission buttons remain inside their original form while
  the body alone can shrink. Short modals use natural height rather than filling the viewport.
- Footer actions wrap when necessary; long labels may wrap instead of widening the modal beyond
  its viewport clearance. Restore-choice navigation actions live in the non-scrolling footer.
- `DialogLayout` observes VisualViewport resize/scroll events when available and publishes its
  dimensions and offsets to the dialog. CSS uses these values for centering and height bounds;
  the fallback uses the dynamic viewport height. This accommodates visible-viewport changes such
  as on-screen keyboards without changing navigation breakpoints.
- Existing save, validation, confirmation/countdown, cancellation, and pending-state handling stays
  feature-owned. The shared close control follows each caller's cancellation and disabled state.

`MobileEditorDialog` opens and closes in a layout effect. Its cleanup closes the native dialog
before React removes it from the DOM, then explicitly focuses the captured opener if it remains
connected, without scrolling. Passive-effect teardown after removal did not restore opener focus.
The 2026-10-11 focused browser run verifies Cancel/Close/Escape focus restoration for member and
contact editors without weakening the existing assertions. See [[member-management]] and
[[people-directory]].

Group Settings keeps its identity and currency summary cards in place. **Edit name & icon** opens
the shared modal at every width, prefilled from the saved group; Save writes the update, while
Cancel/Close/Escape discards edits and clears errors. Failed saves remain in the modal. **Change**
opens the currency picker in the same bounded layout with fixed Cancel/Save currency actions.
Saving a different choice closes the picker before opening the existing no-conversion confirmation,
so only one currency dialog is open at a time. Cancelling confirmation returns to the picker with
the choice retained; cancelling the picker discards that choice, and reopening starts from the
saved currency. Only confirming the change writes it. See [[money-representation-and-rounding]].

`src/shared/tests/browser/modal-layout.e2e.ts` adds margin and fixed-control assertions for real
management, expense-creation, payment, group identity, currency, and export-notice dialogs at
280–1440px widths,
including induced long bodies and naturally short confirmations. Existing onboarding person-editor
and mobile Filters coverage adds explicit header/footer and 16px-clearance assertions. These
app-wide layout changes pass in the final 2026-10-10 full browser suite, with additional production
responsive/offline smoke checks at 280–1920px. See [[testing-strategy]].
Group-settings cases also cover cancellation/reset, validation, saved-name reloads, picker-to-
confirmation transitions, and unchanged expense amounts after a currency relabel.

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
Final responsive captures confirm saved themes and no horizontal overflow. The 2026-10-10 stable
full-browser rerun passes 314 cases with 18 expected viewport skips and no failures, including the
subsequent group Analytics drill-down. See
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
The 2026-10-10 full-browser run also passes after scaling; see [[main-screen]] and
[[testing-strategy]].
Expenses scrolls the main pane on all viewport sizes: the group header, expense title/subtitle,
and then the search/sort/filter toolbar stick in sequence, while insights scroll away. The ledger
uses natural height with no inner vertical scroll or ten-entry height cap at any width; all expense
and payment rows are reached through the outer `#main-content` pane. Short filtered lists also
take only their natural height. Browser coverage for outer-only scrolling, last-row access,
mixed expense/payment history, and navigation resets passes in the final 2026-10-10 full suite.
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
the outer pane's scroll position while filtering, subject to native clamping when results shrink.
See [[filtering]] and [[main-screen]].

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
- **Member count**
- **Expense count** — e.g. "21 expenses"
- **Net balance** — payment-aware local-member net, placed below the name and member/expense counts

Names and counts wrap instead of truncating; the balance occupies its own bottom line aligned with
the text, leaving the group icon beside the details. Adjacent rows have a thin theme-token divider
and vertical spacing. Rows remain transparent, including hover and active states; no background
fill is added. Tablet/desktop light/dark browser coverage for long names, large positive/negative
balances, separators, and navigation passes in the final 2026-10-10 full suite. See [[testing-strategy]].

---

## Chrome Components

Route content is shared across viewport states. The navigation chrome differs:

- **Footer** — mobile only; route-aware, except on Add/Edit Expense forms
- **Sidebar** — tablet and desktop app routes, except Add/Edit Expense focus-mode forms
- **Activity panel** — desktop only (1080px+); Dashboard, app-wide Analytics and Unsettled, and non-Settings group routes show saved action events and legacy expense fallbacks; create-group shows its live preview

### Bottom nav behaviour by route (mobile)

| Route | Bottom nav items |
|-------|-----------------|
| Dashboard context, primary row | Groups, Activity, New group, Unsettled, More / Close |
| Dashboard context, expanded upper row | Contacts, Analytics, Import, Restore, Settings |
| Inside a group, primary row | Overview, Expenses, Add, Members, More / Close |
| Inside a group, expanded upper row | Balances, Analytics, Activity, Cats & Tags, Settings |
| Add/Edit Expense | No bottom nav |

All in-group destinations resolve to nested routes. Dashboard footer destinations also have routes,
though some screens are still lightweight. App-wide Analytics is reachable through dashboard
previews and dashboard More. Group Analytics is reachable through its group preview and group
More; the two destinations keep their existing scope. Public Import/Restore do not render the
footer. See [[dashboard]], [[people-directory]], and [[main-screen]].

---

## Expense Routes

Saved expense links open detail at `/groups/:groupId/expenses/:expenseId`; editing uses its `/edit`
path. The existing `/expenses/new` route remains creation and is the mobile footer's centered Add
destination. Balances is linked from Overview and the group sidebar, and through More in the
mobile group footer, at `/groups/:groupId/balances`.

## Related

- [[dashboard]] — dashboard main pane layout and sections
- [[main-screen]] — home screen layout and navigation
- [[state-management]] — store shape
