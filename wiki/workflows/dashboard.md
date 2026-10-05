# Dashboard View

Last updated: 2026-10-05

**Purpose:** Record the current dashboard implementation and the target cross-group summary design.

## Current Implementation

The dashboard currently renders:

- A time-aware greeting using the local user's name and icon
- The current local date in `12-Jan-2026` form; native date-entry controls elsewhere retain their
  browser-managed presentation and stored timestamps are unchanged
- A New group link in the dashboard content on wider screens when groups exist; mobile instead
  has a centered purple New group item in its footer. When no groups exist, the dashboard empty
  state also offers New group and Import group actions at every width. There is no floating
  New group button.
- An Import Group link in the empty state; app-level Settings also links to the public Link/CSV/ZIP
  intake route after groups exist
- An empty-state prompt when there are no groups
- Per-group balance cards and an overall balance summary (or a mixed-currency notice)
- Unsettled-balance and category-spending previews at widths of 640px and above; the unsettled
  preview has a labelled View all link and arrow to `/unsettled`
- At widths of 640px and above, the dashboard category preview shows up to six categories; its
  heading and each chart row link to `/analytics`. At 640–767px, it also shows View all and a
  shorter subtitle. Below 640px, the `max-sm:hidden` dashboard-lower container hides both the
  category and unsettled previews, leaving no dashboard link to Analytics; Analytics is still
  directly routable but has no mobile footer item. With one shared currency and recorded expenses,
  the app-wide full page shows spending categories and their total; with multiple currencies, it
  shows a notice instead of combining amounts. Mobile has a Back to dashboard link. A separate
  group-scoped preview on Overview is visible at every width and links to
  `/groups/:groupId/analytics`; that route only totals the selected group's expenses, including
  when other groups use different currencies. Its Back button is available at every width: it
  follows in-app history or opens the group Overview when the route was loaded directly.
- Links from each group row to that group's Overview route

The desktop right pane shows saved activity events across all groups in recording order (event
`createdAt` descending). Create/update/delete actions for expenses, tags, categories, groups,
members, and contacts are recorded separately from current entities; imported groups have a group
creation event. Individual deleted-item entries retain their name, icon, amount (for expenses), and
group snapshot without a link **while that group still exists**. Permanent group deletion purges all
of its activity except group-created and group-deleted entries. Global contact entries remain.
Older expenses recorded before the event table, including transferred expenses, still appear as
derived entries while they exist. Past deletions cannot be reconstructed. On group routes other than
Settings, the panel filters by group, including expense forms. The dedicated Activity route shows
the same cross-group feed; tablet renders no separate activity section.
Expense rows display the category icon (or group fallback) as a non-profile image on both surfaces.
Compact rows show the recording date and time below the group name.
Compact desktop rows show the group and date/time on separate lines; longer titles and group names
wrap for more visible content, with no hover/focus tooltip.
Rendered dates use `DD-MMM-YYYY` and rendered times use padded 12-hour `hh:mm AM/PM`; expense
detail labels occurred date and time separately and places recording metadata between the banner
and the Paid by/Split cards.
Each group link opens the nested group-detail route, whose Overview shows the local user's net
  position, total group spend, category count, up to six featured members, five recent expenses,
  and a group-only category-spending preview beneath those expenses.

The empty state offers both **Create your first group** and **Import an existing group**. Settings
keeps Import group reachable once groups exist. Import validates the package, shows count-only
review and identity selection, and creates a separate editable group. See [[import-export]].

## Implemented Sections and Remaining Target Details

### Page Header

The time-aware greeting uses the device clock (e.g. "Good morning Rahul"). This is implemented.

Light/dark mode toggle lives in Settings, not on the dashboard.

---

### Section Status

Overall totals, per-group balance cards, the desktop unsettled preview, category spending at
widths of 640px and above, and saved action activity are implemented as described under Current
Implementation. The sections below distinguish remaining presentation work from working screens.

#### 1. Overall Summary — implemented

Two headline numbers at the top of the pane:
- Total to get — sum of all positive net balances across all groups
- Total to give — sum of all negative net balances across all groups

**Multi-currency edge case:** If the user's groups span more than one currency, summing them produces a meaningless total. In this case the overall summary is hidden and replaced with a message indicating multiple currencies are in use. Per-group cards remain visible since each group has a single currency.

**Empty state:** The banner invites creation of the first group; it does not show two numeric zero
totals when there are no groups.

---

#### 2. Per-Group Stat Cards — implemented

One card per group showing the user's net position in that group.

Clicking a card navigates to that group's Overview page; the sidebar selection updates to reflect the active group.

**Empty state:** No cards; section replaced by a create-first-group prompt.

---

#### 3. Unsettled Balances — preview at ≥640px and separate route implemented

A compact list of suggested payments involving the local user, grouped by the originating group;
each row names the other person, direction, amount, and group. The dashboard preview is hidden
below 640px; mobile has a separate Unsettled footer route. Only non-zero suggestions are listed.

This is distinct from per-group cards: group cards show the user's net position per group; unsettled balances show the individual people behind those numbers.

**Empty state:** The preview says "All square!"; the separate route explains that no unsettled
balances remain.

---

#### 4. Category Spending Chart — app preview hidden below 640px; app and group Analytics routes implemented

A visual breakdown of total spending by category, aggregated across same-currency groups, all time.
There is no time filter.
Each expense refers to its own group's category ID; the chart resolves that category and aggregates
by its exact name. Two groups with `Petrol Expense` become one total, but a differently spelled or
capitalized name is a separate total. New-category suggestions help copy the same spelling/icon;
deleting one group removes only its expenses from the total. See [[category-management]].

**Empty state:** For an existing single-currency group with no expenses, the visible preview says
"No spending yet." The section is absent when no groups exist or at widths below 640px.
The group Overview preview instead remains visible at every width, including for an empty group;
its View all action opens that group's analytics page, where an empty group has no chart. Group
and app previews use the same category-name aggregation and sum all payer contributions.

---

#### 5. Activity — saved action feed with legacy expense fallbacks

The desktop panel and dedicated Activity route show saved, timestamped snapshots for supported
create/update/delete actions across expenses, groups, categories, tags, members, and contacts, plus
group imports. Rows show an action label, saved group name and recording date/time, and an amount
for expense actions. Deleted-entity rows retain their snapshot but are not links. Expenses without
a saved creation event appear as derived rows only while they still exist; older deleted actions
cannot be reconstructed. Relative times (e.g. "7hrs ago") remain a target design detail.

**Current placement by breakpoint:** desktop uses a dedicated right-side activity panel;
mobile has an Activity footer destination. Tablet has neither panel nor stacked section.
Adding a tablet section remains a target, not implemented behavior.

**Empty state:** The feed shows "No activity yet" when there are no events or legacy expenses.

---

## Mobile Content Mapping

On narrow mobile screens (<640px), the dashboard retains the groups and overall summary but hides
the unsettled and category previews. Analytics is directly routable, but has no link from the
dashboard or mobile footer at this width. At 640–767px, the previews are visible. Other
destinations are reached through the bottom navigation:

| Desktop dashboard section | Mobile tab |
|--------------------------|------------|
| Groups list + overall summary | Groups tab |
| Activity feed | Activity tab |
| Create a group | Centered New group footer item |
| Unsettled balances | Unsettled tab |
| Category spending chart | Groups tab preview at ≥640px → Analytics page; below 640px no visible dashboard link |
| App settings + profile editing | Settings tab |

Analytics retains its route but no longer has a footer item. Activity reads persisted action
snapshots and derives legacy entries for expenses with no saved creation event.

---

## Navigation

Clicking a current group row navigates to that group's Overview route. The sidebar group
item also links to the Overview and detects the active `groupId`.

---

## Related

- [[layout-architecture]] — three-pane vs two-pane layout, breakpoints, sidebar structure
- [[main-screen]] — in-group navigation and tabs
- [[balance-calculation]] — how net balances are computed
- [[import-export]] — dashboard import entry and fresh-copy behavior
- [[main-screen]] — group Overview and group-scoped Analytics navigation
