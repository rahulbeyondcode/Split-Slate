---
name: filtering
description: Expense list filtering — all supported filter fields and behaviour
metadata:
  type: workflows
---

# Expense Filtering

Purpose: document the implemented expense-list filters, their matching rules, and test coverage.

Last updated: 2026-10-02

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
- Empty source and no-match states have distinct copy, and the result count reports matching versus
  total expenses.
- Unavailable category, tag, payer, and member IDs are pruned from the URL when the list mounts;
  clearing removes filter parameters but retains a selected nondefault sort. Unknown query fields
  and invalid split types are ignored.
- Filter state is not written to IndexedDB or Zustand.

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

The Expenses route fits the available viewport with the results list as its own scroll area. Sort
and Filters popovers render outside that clipped page region, anchor to their controls, and scroll
independently within the available viewport; they must not be clipped by the bounded ledger.

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

---

## Related

- [[main-screen]] — expense list where filtering is applied
- [[domain-models]] — Expense fields that filters operate on
- [[split-types]] — split type values used in the split type filter
- [[tag-management]] — group tag records and optional expense references
