---
name: filtering
description: Expense list filtering — all supported filter fields and behaviour
metadata:
  type: workflows
---

# Expense Filtering

Purpose: document the implemented expense-list filters, their matching rules, and test coverage.

Last updated: 2026-10-11

## Overview

All eight logical filters on this page are implemented. The expense list defaults to expense date
(`when`) descending and displays name, total paid, payer names, date/time, and category. Names open
expense detail with edit/delete actions.

Filters update in real time. Different filter fields are ANDed together, while multiple selections
inside one category, tag, payer, member, or split-type field are ORed. The expense-list URL is the
source of truth: nonempty text/date/amount values use named query parameters, and multi-selects use
repeated parameters (for example `?memberIds=a&memberIds=b`). Opening or reloading a link restores
the filters; navigation to an expense detail or edit screen and back carries the query along. Other
group routes do not retain hidden filter state. Filter edits replace the current URL entry rather
than adding a history entry per keystroke.

---

## Filterable Fields

| Field | Type | Notes |
|-------|------|-------|
| Expense name | Text search | Trimmed, case-insensitive partial match |
| Date range | `when` date picker | Inclusive local-calendar from/to bounds on the actual expense date |
| Category | Multi-select | Matches any selected category, including inactive historical categories |
| Tags | Multi-select | Matches when `Expense.tagIds` contains any selected group tag ID |
| Paid by | Multi-select | Matches any selected member in `transactions.paid` |
| Member involved | Multi-select | Matches any selected member in `createdBy`, `transactions.paid`, or `transactions.owes` |
| Split type | Multi-select | equal / amount / shares / percentage / adjustment |
| Amount range | Number range | Inclusive minimum/maximum against the sum of all paid rows |

---

## Behaviour

- Filters are applied in real time as the user changes selections.
- All active filter fields are ANDed together; selections within one multi-select field use OR.
- The visible active count counts logical fields, not individual selected options. Date bounds count
  as one field and amount bounds count as one field.
- Date values must be real calendar dates and the end cannot precede the start.
- Amount values use fixed two-decimal precision and a safe-integer hundredths limit; the maximum
  cannot be less than the minimum.
- Invalid bounds show field errors and suppress results until corrected.
- Clearing all filters returns to the full unfiltered expense list.
- Empty source and no-match states have distinct copy. The matching-versus-total result count is
  visible on mobile only while a filter is active; desktop continues showing it unfiltered. Invalid
  filters still show corrective status text on both layouts.
- Unavailable category, tag, payer, and member IDs are pruned from the URL when the list mounts;
  clearing removes filter parameters but retains a selected nondefault sort. Unknown query fields
  and invalid split types are ignored.
- Filter state is not written to IndexedDB or Zustand.
- Selected non-search filters appear as removable chips below the search/sort/filter toolbar at
  every screen width, without opening the filter popover. Each selected category, tag, payer,
  involved member, and split type has its own chip; date bounds and amount bounds each share one
  range chip. Search text stays in the input rather than appearing twice. Inactive categories
  retain their historical label, and invalid range values remain visible and removable.
- Removing a chip updates the form and URL immediately, preserves all other filters and the sort,
  and clears both bounds when removing a range chip. Clear all filters remains available. Chips
  use compact 10px-reference text, reduced padding, 10px remove icons, and a 24px minimum height.
  Pills and their labels stay on one non-wrapping row, scrolling horizontally at every screen
  width instead of growing the sticky toolbar. The scroll container reserves 16px of bottom padding
  beneath the pills so overlay scrollbars do not cover them; native non-overlay scrollbars sit
  below the content. Group Analytics category selections show their chips immediately.
  The shared unlayered `button { font: inherit; }` reset overrides ordinary Tailwind font utilities;
  chip font size and line height use explicit important utilities to retain their compact sizing
  without changing the global reset.
- Active chips use seven fixed, distinct filter-type hues: Category purple, Tags blue, Paid by
  green, Member pink, Split orange, Date cyan, and Amount gold/yellow. All selections within a type
  share the same colour, independent of selection order, removal, and the saved colour of a tag.
  Scoped chip backgrounds, borders, text, and hue-preserving hover colours have separate light/dark
  palettes. Labels, remove icons, keyboard controls, compact sizing, and horizontal scrolling remain
  intact; colour supplements the labels rather than replacing them. Search remains in its input
  and has no duplicated chip. Matching rules, URL state, and sort behavior are unchanged.
- On group Analytics, clicking a category row opens that group's Expenses route with only that
  category filter active and the default newest-first sort, at every screen width. The link uses
  category IDs rather than names; a chart row combining same-name categories selects all matching
  group category IDs, including inactive historical categories. App-wide Analytics rows remain
  noninteractive. See [[dashboard]].

## Expense Insights

A compact ledger summary sits above the filter controls on the Expenses route; it is not the large
Overview balance hero. It derives from the same matching expenses as the list, independent of
sort order. It shows matching count, total paid, rounded average per expense, and the highest-spend
category. It has no member-by-member disclosure; a separate action opens full-group Balances.
The summary uses a teal-and-warm accent, distinct from Overview's purple position hero, and clearly
labels the figures as matching-expense totals when filters are active.
The group header's total remains the unfiltered group total.

No matches show zero totals. Invalid filter bounds hide insights instead of showing a stale or
misleading total. Multi-payer contributions use stored integer hundredths; a missing member
reference produces an error rather than silently omitting transactions. See [[balance-calculation]]
and [[main-screen]].

On desktop/tablet, the main pane scrolls like mobile so insights scroll away while the group header,
ledger title/subtitle, and search/sort/filter toolbar remain sticky. Those sticky surfaces and the
spacing around the filter toolbar are painted with the solid page background so scrolling rows do
not show through. At every width the ledger uses natural height with no inner vertical scrolling
or ten-entry cap; the main pane reaches the final expense/payment row. Short filtered lists do not
get a fixed-height empty area. On mobile, search fills its own row, with equal-width Sort and
Filters buttons below. Below 768px, Filters opens the shared native modal dialog with a title/close
control, independently scrolling fields, and a fixed Done/Clear all footer. Selections update the
URL and results immediately; Done, Close, and Escape dismiss without reverting them. Height-only
viewport changes keep the modal open; crossing the mobile/tablet boundary closes it. Tablet/desktop
Filters retains its anchored popover. Sort remains a portaled popover at every width, tracks its
anchor while scrolling, and uses the entire toolbar as its mobile anchor.
Both popovers also update after filter-value renders and observed form/group-page size changes.
Filtering or validation can remove insights or resize the sticky toolbar without a window event;
re-anchoring prevents a stale fixed panel from overlapping and blocking its own trigger.

## Sorting

The single-choice sort popover has Date (newest first by default, oldest first), Price (high to low,
low to high), Name (A–Z, Z–A), and Group by (same category, same tags) sections. Price is the sum of
all payer amounts in fixed hundredths, not a single payer's contribution. Name sorting is
case-insensitive. Category grouping orders category names alphabetically; tag grouping compares
the entire set of tag IDs, independent of the order they were assigned, then orders those sets by
their tag names. Each expense appears once, without category/tag headers. Untagged expenses and
expenses with an unavailable category appear after named groups in their respective modes. Within
a matching name or group, ties use newest expense date first, then expense ID for a repeatable
order. Sorting runs after filtering and does not contribute to the active-filter count. A
nondefault selection uses the `sort` query parameter; unknown values fall back to newest. It
survives reloads and expense-detail navigation. Clear all filters retains the selected sort;
returning to newest removes `sort` from the URL.

External payments join the timeline only for unfiltered newest/oldest date sorts. The merged
timeline is date-sorted only in that mode; otherwise expense entries retain the selected expense
sort instead of being re-sorted by date. The 2026-10-08 pre-scaling full browser suite verified all
eight sort modes on desktop/mobile after correcting that timeline merge. Unfiltered desktop status
includes the payment count, including zero; filtered results remain expense-only. See
[[settlement-recording]] and [[testing-strategy]].

## Tests

`src/features/expenses/tests/utils/expense-filters.test.ts` directly covers all matching modes,
AND/OR behavior, local inclusive dates, fixed precision, safe amount bounds, active-field
counting, empty inputs, invalid ranges, and removal of unavailable option IDs.
It also covers all sort modes, exact multi-tag grouping, URL round-tripping, unknown sort values,
and source immutability.

`src/features/group-detail/tests/utils/expense-insights.test.ts` checks multi-payer paid/owed/net
allocations, empty and single-expense results, category ranking, and missing member guards.
`src/features/expenses/tests/browser/expense-filters.e2e.ts` manipulates every filter on desktop and
mobile, verifies validation and clearing, confirms state survives child-route navigation, and
deletes a selected tag while the list is unmounted. When the list remounts, selected category, tag,
payer, and involved-member IDs that are no longer available are removed automatically.
It also checks the sectioned single-choice sort popover, all eight sort orders, retention
through clearing, reload, and detail navigation, plus filter-aware insights.
New chip cases cover every selected option, independent removal, range clearing, invalid/open-ended
values, inactive Analytics selections, stale-option pruning, reloads, long labels, single-row
horizontal scrolling, scrollbar clearance, compact typography/padding, 24px minimum controls, and
keyboard removal at mobile/tablet/desktop
widths. Mobile modal cases cover scrolling, live selections, Done/Close/Escape, clearing with sort
retention, focus return, height-only resizing, and switching to tablet. Compact-size assertions
previously exposed the global button-font reset; the explicit compact font override now passes.
The latest chip/modal/horizontal-scroll cases and a popover-trigger overlap regression pass in the
final 2026-10-10 full browser suite. Eight production responsive/offline smoke cases at 280–1920px
also pass. See [[testing-strategy]].

The subsequent filter-type colour change is covered by the final 2026-10-11 full suite. Added light/dark
browser cases at mobile/tablet/desktop widths check seven distinct colours, at least 20 degrees
between border hues, consistent same-type styling, 4.5:1 text contrast on normal/hover backgrounds,
and stable colours after keyboard removal and reload. These revised checks pass; future execution
requires explicit approval. See [[testing-strategy]].

`src/features/group-detail/tests/browser/group-overview-navigation.e2e.ts` adds group Analytics
drill-down cases at narrow-mobile, tablet, and desktop widths, covering active category selections,
URL encoding, fresh filter state, reload, clearing, keyboard activation, and same-name historical
categories. These cases pass in the final 2026-10-10 full-browser suite (389 passes, 21 expected
viewport skips, no failures), using the responsive Filters dialog/popover controls. Earlier
Analytics-specific smoke checks verified clickable amount cells and offline navigation; the latest
production smoke matrix also verifies filtered reloads and saved themes. See [[testing-strategy]].

---

## Related

- [[main-screen]] — expense list where filtering is applied
- [[domain-models]] — Expense fields that filters operate on
- [[split-types]] — split type values used in the split type filter
- [[tag-management]] — group tag records and optional expense references
