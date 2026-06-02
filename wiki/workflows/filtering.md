---
name: filtering
description: Expense list filtering — all supported filter fields and behaviour
metadata:
  type: workflows
---

# Expense Filtering

Last updated: 2026-05-21

## Overview

The expense list supports strong filtering across all major expense fields. Filters can be combined — only expenses matching all active filters are shown.

---

## Filterable Fields

| Field | Type | Notes |
|-------|------|-------|
| Expense name | Text search | Free-text; matches partial strings |
| Date range | `when` date picker | From/to date range on the actual expense date |
| Category | Multi-select | Pick one or more categories |
| Tags | Multi-select | Matches expenses that carry any of the selected tags |
| Paid by | Multi-select | Filter by who paid (matches `paid[]` array) |
| Member involved | Multi-select | Any member in `paid[]` or `owes[]` of the expense |
| Split type | Multi-select | equal / amount / shares / percentage / adjustment |
| Amount range | Number range | Min and/or max total expense amount |

---

## Behaviour

- Filters are applied in real time as the user changes selections
- All active filters are ANDed together (expense must match all)
- A visible indicator shows when filters are active (e.g. filter icon badge with count)
- Clearing all filters returns to the full unfiltered expense list
- Filter state is **not** persisted — resets when the user navigates away from the group

---

## Related

- [[main-screen]] — expense list where filtering is applied
- [[domain-models]] — Expense fields that filters operate on
- [[split-types]] — split type values used in the split type filter
- [[tag-management]] — how tags are created and managed within a group
