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
  the full page shows spending categories and their total; with multiple currencies, it shows a
  notice instead of combining amounts. Mobile has a Back to dashboard link. The desktop title and
  subtitle remain unchanged.
- Links from each group row to that group's Overview route

The desktop right pane shows persisted expense activity from every group in recording order
(`createdAt` descending), with the recording date and time below the group name. On group
routes other than Settings, that pane shows only that group's expenses, including expense forms.
The dedicated Activity route shows the same cross-group feed; tablet renders no separate activity
section.
Activity rows display the expense category icon (or its group icon fallback) as a non-profile
image on both surfaces. Profile-only rendering would replace those keys with the default avatar.
Compact desktop rows show the group and date/time on separate lines; longer titles and group names
wrap for more visible content, with no hover/focus tooltip.
Rendered dates use `DD-MMM-YYYY` and rendered times use padded 12-hour `hh:mm AM/PM`; expense
detail labels occurred date and time separately and places recording metadata between the banner
and the Paid by/Split cards.
Each group link opens the nested group-detail route, whose Overview shows the local user's net
position, total group spend, category count, up to six featured members, and three recent expenses.

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
widths of 640px and above, and the expense-derived Activity view are implemented as described
under Current Implementation.
The sections below preserve intended behavior while distinguishing unfinished presentation and
history from the working screens; they are not five wholly unimplemented sections.

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

#### 4. Category Spending Chart — preview hidden below 640px; full Analytics route implemented

A visual breakdown of total spending by category, aggregated across same-currency groups, all time.
There is no time filter.

**Empty state:** For an existing single-currency group with no expenses, the visible preview says
"No spending yet." The section is absent when no groups exist or at widths below 640px.

---

#### 5. Activity — expense-derived feed implemented; full action history pending

A feed of current recorded expenses across all groups, ordered by `createdAt`, appears in the
desktop panel and the dedicated Activity route. Editing or deleting an expense does not retain an
independent action snapshot; category, tag, member, contact, and group changes have no activity
events. A persistent all-action history remains a target. Current expense rows show:

- **Line 1:** Left — who paid for which expense; Right — amount (e.g. "₹2,400")
- **Line 2:** Group name + recording date and time in the current implementation; relative time
  (e.g. "Goa Trip — 7hrs ago") remains a target design detail

**Current placement by breakpoint:** desktop uses a dedicated right-side activity panel;
mobile has an Activity footer destination. Tablet has neither panel nor stacked section.
Adding a tablet section remains a target, not implemented behavior.

**Empty state:** Empty feed with a no-records message.

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

Analytics retains its route but no longer has a footer item. The Activity route reads persisted
expense records rather than placeholder entries.

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
