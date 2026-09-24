---
name: filtering
description: Expense list filtering — all supported filter fields and behaviour
metadata:
  type: workflows
---

# Expense Filtering

Purpose: document the implemented expense-list filters, their matching rules, and test coverage.

Last updated: 2026-09-25

## Overview

All eight logical filters on this page are implemented. The expense list sorts matching expenses
by `when` descending and displays name, total paid, payer names, date/time, and category. Names open
expense detail with edit/delete actions.

Filters update in real time. Different filter fields are ANDed together, while multiple selections
inside one category, tag, payer, member, or split-type field are ORed. The form is memory-only and
is keyed by group, so it survives navigation among routes inside the same group but resets after
leaving that group or switching groups.

---

## Filterable Fields

| Field | Type | Notes |
|-------|------|-------|
| Expense name | Text search | Trimmed, case-insensitive partial match |
| Date range | `when` date picker | Inclusive local-calendar from/to bounds on the actual expense date |
| Category | Multi-select | Matches any selected category, including inactive historical categories |
| Tags | Multi-select | Matches when `Expense.tagIds` contains any selected group tag ID |
| Paid by | Multi-select | Matches any selected member in `transactions.paid` |
| Member involved | Multi-select | Matches any selected member in `transactions.paid` or `transactions.owes` |
| Split type | Multi-select | equal / amount / shares / percentage / adjustment |
| Amount range | Number range | Inclusive minimum/maximum against the sum of all paid rows |

---

## Behaviour

- Filters are applied in real time as the user changes selections.
- All active filter fields are ANDed together; selections within one multi-select field use OR.
- The visible active count counts logical fields, not individual selected options. Date bounds count
  as one field and amount bounds count as one field.
- Date values must be real calendar dates and the end cannot precede the start.
- Amount values use the group's currency precision and safe-integer minor-unit limit; the maximum
  cannot be less than the minimum.
- Invalid bounds show field errors and suppress results until corrected.
- Clearing all filters returns to the full unfiltered expense list.
- Empty source and no-match states have distinct copy, and the result count reports matching versus
  total expenses.
- Filter state is not written to IndexedDB or Zustand.

## Tests

`src/features/expenses/tests/utils/expense-filters.test.ts` directly covers all matching modes,
AND/OR behavior, local inclusive dates, currency precision, safe amount bounds, active-field
counting, empty inputs, invalid ranges, and removal of unavailable option IDs.

`src/features/expenses/tests/browser/expense-filters.e2e.ts` manipulates every filter on desktop and
mobile, verifies validation and clearing, confirms state survives child-route navigation, and
deletes a selected tag while the list is unmounted. When the list remounts, selected category, tag,
payer, and involved-member IDs that are no longer available are removed automatically.

---

## Related

- [[main-screen]] — expense list where filtering is applied
- [[domain-models]] — Expense fields that filters operate on
- [[split-types]] — split type values used in the split type filter
- [[tag-management]] — group tag records and optional expense references
