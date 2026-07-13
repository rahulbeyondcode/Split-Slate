# Dashboard View

Last updated: 2026-08-16

**Purpose:** Record the current dashboard implementation and the target cross-group summary design.

## Current Implementation

The dashboard currently renders:

- A static `"Hi, {name}"` greeting using the local user's name and icon
- A New Group link
- An empty-state prompt when there are no groups
- A simple group list showing icon, name, and currency
- Links from each group row to that group's Overview route

The main dashboard does not yet compute balances, category totals, unsettled debts, or activity. It
renders groups in store order rather than by recent activity. The desktop right pane renders
hardcoded sample activity; tablet renders no activity section. Each group link opens the committed
nested group-detail route, whose overview currently shows member count, expense count, and total
paid. The richer financial overview remains in progress.

## Target Design

---

## Page Header

The target dashboard opens with a time-aware greeting using the device clock (e.g. "Good morning
Rahul"). This remains planned; the current greeting is always `"Hi"`.

Light/dark mode toggle lives in Settings, not on the dashboard.

---

## Planned Sections

### 1. Overall Summary

Two headline numbers at the top of the pane:
- Total to get — sum of all positive net balances across all groups
- Total to give — sum of all negative net balances across all groups

**Multi-currency edge case:** If the user's groups span more than one currency, summing them produces a meaningless total. In this case the overall summary is hidden and replaced with a message indicating multiple currencies are in use. Per-group cards remain visible since each group has a single currency.

**Empty state:** Both numbers show zero. A prompt to create the first group is shown.

---

### 2. Per-Group Stat Cards

One card per group showing the user's net position in that group.

Clicking a card navigates to that group's Overview page; the sidebar selection updates to reflect the active group.

**Empty state:** No cards; section replaced by a create-first-group prompt.

---

### 3. Unsettled Balances

A compact list of person-level balances across all groups. Each entry is one or two lines. Format: group name first, then direction and amount (e.g. "Goa Trip — You owe ₹1,200" or "Office Lunch — Karan owes you ₹450"). Only non-zero balances are listed.

This is distinct from per-group cards: group cards show the user's net position per group; unsettled balances show the individual people behind those numbers.

**Empty state:** "No unsettled balances" — shown when all groups are settled.

---

### 4. Category Spending Chart

A visual breakdown of total spending by category, aggregated across all groups, all time. No time filter in V1.

**Empty state:** Section hidden or shows a placeholder until at least one expense exists.

---

### 5. Activity

A feed of recent actions across all groups. Each activity item is a two-line, two-column component:

- **Line 1:** Left — who did what (e.g. "Rahul paid Scooty rentals"); Right — amount (e.g. "₹2,400")
- **Line 2:** Group name + time ago (e.g. "Goa Trip — 7hrs ago")

**Target placement by breakpoint:**
- Desktop (1080px+): shown in the dedicated right-side activity panel, not in the main pane
- Tablet (768px–1079px): appears as a section stacked below main content, under an "Activity" heading
- Mobile: dedicated Activity destination in the footer navigation

**Empty state:** Empty feed with a no-records message.

---

## Planned Mobile Content Mapping

On mobile, the dashboard content is not a single pane — it is distributed across the bottom nav tabs. No content is dropped; it is reorganised:

| Desktop dashboard section | Mobile tab |
|--------------------------|------------|
| Groups list + overall summary | Groups tab |
| Activity feed | Activity tab |
| Unsettled balances | Unsettled tab |
| Category spending chart | Analytics tab |
| App settings + profile editing | Settings tab |

Only the Groups/Dashboard destination is currently routed. The other footer items are visible but
their route components have not been implemented.

---

## Navigation

Clicking a current group row navigates to that group's lightweight Overview route. The sidebar group
item also links to the Overview and detects the active `groupId`.

---

## Related

- [[layout-architecture]] — three-pane vs two-pane layout, breakpoints, sidebar structure
- [[main-screen]] — in-group navigation and tabs
- [[balance-calculation]] — how net balances are computed
