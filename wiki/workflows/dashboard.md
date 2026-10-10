# Dashboard View

Last updated: 2026-10-11

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
- An Import Group link in the empty state; app-level Settings and mobile More → Import also link
  to the public Link/CSV/ZIP intake route after groups exist
- An empty-state prompt when there are no groups
- Per-group balance cards and an overall balance summary (or a mixed-currency notice)
- Unsettled-balance and category-spending previews at every width when at least one group exists,
  including a single group; they stack beneath the group list on mobile. The unsettled preview has
  a labelled View all link and arrow to `/unsettled`. Category spending requires one shared currency.
- The dashboard category preview shows up to six categories; its heading and each row link to
  `/analytics`. Below 768px, it also shows View all and a shorter subtitle, providing mobile
  dashboard access to Analytics alongside its More entry. With one shared currency and recorded expenses,
  the app-wide full page shows spending categories and their total; with multiple currencies, it
  shows a notice instead of combining amounts. App-wide Analytics has a Back button at every width
  that follows in-app history or opens Dashboard when entered directly. A separate
  group-scoped preview on Overview is visible at every width and links to
  `/groups/:groupId/analytics`; that route only totals the selected group's expenses, including
  when other groups use different currencies. Its Back button is available at every width: it
   follows in-app history or opens the group Overview when the route was loaded directly.
- On the full group Analytics page, category rows link to that group's Expenses page with only
  the clicked category filter active, at every screen width. Same-name category rows select all
  matching group category IDs; app-wide Analytics rows remain noninteractive. See [[filtering]].
- Links from each group row to that group's Overview route

The desktop right pane shows saved activity events across all groups on Dashboard, app-wide
Analytics, and Unsettled in recording order (event `createdAt` descending). Create/update/delete
actions for expenses, tags, categories, groups,
members, and contacts are recorded separately from current entities; imported groups have a group
  creation event. Individual deleted-item entries retain their name, icon, amount (for expenses), and
group snapshot without a link **while that group still exists**. Permanent group deletion purges all
of its activity except group-created and group-deleted entries. Global contact entries remain.
Older expenses recorded before the event table, including transferred expenses, still appear as
derived entries while they exist. Past deletions cannot be reconstructed. On group routes other than
  Settings, the panel filters by group, including expense forms. The app-level `/activity` page shows
  the same cross-group feed; tablet exposes it through the app sidebar and exposes the group-only
  `/groups/:groupId/activity` feed through the group sidebar instead of rendering a separate panel.
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
and mobile More keep Import group reachable once groups exist. Import validates the package, shows count-only
review and identity selection, and creates a separate editable group. See [[import-export]].

## Implemented Sections and Remaining Target Details

### Page Header

The greeting and date use one live device-local clock through the dashboard-only
`useDashboardClock` hook. The approved greeting windows are:

| Local time | Greeting |
|---|---|
| 21:30–04:29 | Hello, [name] 🌙 |
| 04:30–11:59 | Good morning, [name] |
| 12:00–16:59 | Good afternoon, [name] |
| 17:00–21:29 | Good evening, [name] |

Cutoffs are inclusive at their start, including 21:30 and 04:30. The late-night Hello avoids treating
midnight as morning or using Good night as an arrival greeting. The saved user's name/profile icon
remain unchanged; a missing name falls back to "there".

While visible, the clock refreshes at the next minute boundary and reschedules from the current
device time. Focus and visibility changes refresh immediately, so returning after sleep/background
time catches up without reloading. The minute timer pauses while hidden and is cleaned up with the
listeners on unmount. The date also updates across midnight, using its existing `DD-MMM-YYYY` format.

Added browser cases cover local-time cutoffs (including 00:54), live transitions, midnight date
rollover, and focus/visibility refresh. These revised checks pass in the final 2026-10-11 full
browser suite. Future execution requires explicit approval. See [[testing-strategy]].

Light/dark mode toggle lives in Settings, not on the dashboard.

---

### Section Status

Overall totals, per-group balance cards, all-width unsettled/category previews, and saved action
activity are implemented as described under Current
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

Each card shows up to five compact member avatars beneath its member/expense counts, using the
linked people's saved profile icons. Additional members are represented by a `+N` count. Each
visible avatar has the person's name as its accessible label and hover title; unresolved people
use the shared profile-icon fallback and an "Unknown member" label. Empty groups omit the avatar
row. This applies at every screen width without replacing the existing counts or balance.
The `+N` indicator appears only beyond five members (ten members show five avatars and `+5`).
Responsive light/dark coverage for zero, one, two, three, five, six, and ten members passes in the
final 2026-10-10 full browser suite. Cards allow their grid minimum width to shrink so long names
truncate inside the card rather than widening the main pane. See [[global-people-directory]],
[[iconography]], and [[testing-strategy]].

Clicking a card navigates to that group's Overview page; the sidebar selection updates to reflect the active group.

**Empty state:** No cards; section replaced by a create-first-group prompt.

---

#### 3. Unsettled Balances — all-width preview and separate route implemented

A compact list of suggested payments involving the local user, grouped by the originating group;
each row names the other person, direction, amount, and group. The dashboard preview is visible at
every width when groups exist; mobile also keeps its separate Unsettled footer route. Only non-zero
suggestions are listed.

This is distinct from per-group cards: group cards show the user's net position per group; unsettled balances show the individual people behind those numbers.

The dashboard preview's heading, responsive subtitle, and View all action sit above and outside
the bordered surface; only suggested-payment rows or the empty-state message remain boxed. This
separates the section visually from the group cards without changing its data or navigation.
Both dashboard preview sections reserve an additional 1rem (16px-reference) top margin above
their headers; the existing 0.75rem header-to-box gap is unchanged in stacked and side-by-side layouts.
In the two-column layout, both sections use a row subgrid with a shared naturally sized header
row and content row. The taller header (including View all or wrapped text) sets the height for
both, keeping the boxed contents' top and bottom edges aligned without fixed header heights.
Stacked sections retain independent natural header heights and the same top margins and gaps.

**Empty state:** The preview says "All square!"; the separate route explains that no unsettled
  balances remain. The separate Unsettled page has a Back button at every width that follows
  in-app history or opens Dashboard on a direct visit.

---

#### 4. Category Spending Breakdown — all-width preview; app and group Analytics routes implemented

A visual breakdown of total spending by category, aggregated across same-currency groups, all time.
There is no time filter.

Full app/group Analytics, the Dashboard preview, and Group Overview share the compact
`CategorySpendingList`. Categories retain descending spending order, with a small icon, stable-width
name column, full amount, one-decimal share of total, and a full-width 4px-reference bar beneath.
There are no divider lines between items or beneath the summary: compact spacing and the spending
bars distinguish rows without a second, confusing set of horizontal lines. 8px-reference vertical
padding remains unchanged, with an extra 8px-reference (0.5rem) gap between adjacent items for
clearer separation. The first and last items have no additional outer gap. Narrow containers stack
names above figures, independently of the viewport's navigation breakpoint. Names take at most two
lines and retain their full text/title; amounts can
wrap rather than being clipped. Full Analytics also summarizes total recorded spending and the
largest category above the list.

Bars show share of **total** spending, not relative size against the largest category, and have no
artificial minimum length. Exact amounts and explicit shares keep tiny categories useful when one
expense dominates. Positive shares below 0.1% display `<0.1%`, not a misleading zero. Six-category
previews use the complete scope's total as their denominator, not the sum of just the visible six.
Category-name aggregation, expense-only totals, currency boundaries, empty states, and navigation
are unchanged: previews open Analytics, full group rows open category-filtered Expenses, and full
app rows remain noninteractive. All ordinary mobile group routes, including Analytics, now expose
the centered navbar Add action instead of a floating Add expense button. See [[main-screen]] and
[[filtering]].

Added browser coverage exercises compact responsive light/dark rows, dominant spending, tiny shares,
long names/large amounts, preview denominators, scope/navigation, and navbar expense creation.
These revised checks pass in the final 2026-10-11 full browser suite. See [[testing-strategy]].

The dashboard preview's heading/link, subtitle, and mobile View all action sit above and outside
the bordered breakdown surface. Only list rows or the empty-state message remain inside. The existing
single-column/two-column layout is retained, with preview visibility restored below 640px.
Earlier responsive light/dark coverage
for both external dashboard headers with populated and empty contents passes in the final
2026-10-10 full suite. Side-by-side coverage also verifies aligned boxes at 1440px and 1920px with
natural headers, a taller action, and a wrapped category title. The subsequent shared compact rows
and restored narrow previews also pass in the final 2026-10-11 full browser suite.

Each expense refers to its own group's category ID; the chart resolves that category and aggregates
by its exact name. Two groups with `Petrol Expense` become one total, but a differently spelled or
capitalized name is a separate total. New-category suggestions help copy the same spelling/icon;
deleting one group removes only its expenses from the total. See [[category-management]].

**Empty state:** For an existing single-currency group with no expenses, the visible preview says
"No spending yet." The section is absent when no groups exist or their currencies differ; screen
width and having only one group do not hide it.
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

Mobile dashboards show the groups and overall summary followed by stacked Unsettled balances and
Spending by category previews when their usual data/currency conditions allow. The category heading,
View all action, and rows link to app-wide Analytics at every mobile width; More also exposes
Analytics independently of those previews. Other destinations are reached through the bottom
navigation's primary or expanded row.

The former hiding rule was unrelated to group count. Commit `a384d9c` (2026-09-27) introduced
`max-sm:hidden` on the preview container. Its unlayered `.dashboard-lower { display: grid; }` rule
overrode Tailwind's layered utility. Commit `b56494f` (2026-10-10), a responsive-regression fix,
added explicit `display: none` below 640px to enforce that old instruction. The approved restoration
removes both preview-hiding rules; the separate narrow-screen New group hiding rule remains intact.
Git history explains the implementation, not which revision or cached stylesheet a deployment serves.

Revised browser coverage expects visible, stacked previews with one group at 280–390px, covers
populated/empty light/dark layouts and mobile Analytics navigation, and retains the mixed-currency
guard. Shared spending-layout cases now include the narrow dashboard preview. These checks pass
in the final 2026-10-11 full browser suite; the separate 2026-10-10 production visual smoke matrix
was not repeated for this restoration.

| Desktop dashboard section | Mobile tab |
|--------------------------|------------|
| Groups list + overall summary | Groups tab |
| Activity feed | Activity tab |
| Create a group | Centered New group footer item |
| Unsettled balances | Stacked Groups-tab preview and Unsettled tab |
| Category spending breakdown | Groups-tab preview when groups share one currency; More → Analytics at all times |
| Contacts directory | More → Contacts |
| Group import | More → Import; existing empty-state and Settings actions retained |
| Whole-app recovery | More → Restore; existing guarded restore flow retained |
| App settings + profile editing | More → Settings |

Analytics retains its app-wide route and is now an expanded footer destination. Activity reads
persisted action snapshots and derives legacy entries for expenses with no saved creation event.

---

## Navigation

Below 768px, the dashboard-context primary row is **Groups, Activity, New group, Unsettled,
More / Close**. New group stays centered and purple. More unfolds an upper row containing
**Contacts, Analytics, Import, Restore, Settings**, using the same anchored lower row, staggered
opening animation, faster closing animation, and rotating/crossfading More/Close icons as the group
navbar. This replaces the primary Settings item, rather than adding a sixth column.

The dashboard footer also appears on app Activity, Analytics, Unsettled, Contacts, Settings, and
New group. Selecting a footer link collapses it; pathname/history/context changes or leaving the
mobile viewport reset expansion. More is highlighted on Contacts, app Analytics, and app Settings.
Hidden links are inert and excluded from assistive technology, and Escape within the navbar closes
it and focuses the toggle. Safe-area-aware content clearance grows with expansion. The existing
Contacts New contact action stays above the expanded row; its editor behavior is unchanged.

Import/Restore open their existing public standalone screens without a navbar. Their Back to
SplitSlate controls return through guarded home; simply visiting them does not write or replace
data. Tablet/desktop sidebars, group navbar destinations, dashboard preview/data rules, and
creation/restore/import forms are unchanged.

Added and revised browser cases cover More destinations, opening/closing and keyboard behavior,
route/history/resize resets, public-screen return/data preservation, 280–767px light/dark layouts,
content clearance, and unchanged tablet/desktop actions. These checks pass in the final 2026-10-11
full browser suite (520 passes, 44 expected skips, zero failures). Future execution requires approval.

Clicking a current group row navigates to that group's Overview route. The sidebar group
item also links to the Overview and detects the active `groupId`.

---

## Related

- [[layout-architecture]] — three-pane vs two-pane layout, breakpoints, sidebar structure
- [[main-screen]] — in-group navigation and tabs
- [[balance-calculation]] — how net balances are computed
- [[import-export]] — dashboard import entry and fresh-copy behavior
- [[main-screen]] — group Overview and group-scoped Analytics navigation
