---
name: paid-by
description: Paid-by selector UX, frequent payers list behaviour, and multi-payer input
metadata:
  type: workflows
---

# Paid-By

Last updated: 2026-05-18

## Overview

The paid-by selector is not a traditional dropdown. It shows a smart quick-select list of up to 5 frequent payers for fast entry without repeated searching. A "Show more" option reveals all group members when needed.

---

## Single Payer (Default Mode)

### The Frequent Payers List

- Shows up to 5 unique members ranked by **how often they have paid** across the group's expense history (frequency count)
- The **most recent payer** (last expense's payer) is pre-selected by default
- "Show more" reveals all remaining group members beyond the top 5

### Initial State (New Group, No Expenses Yet)

When a group has no expenses:
1. Group creator occupies the first slot (pre-selected by default)
2. Remaining slots (up to 4) are filled by other group members in **alphabetical order by name**
3. If the group has fewer than 5 members total, the list is shorter accordingly

### How the List Updates Over Time

After each expense is saved, the app recalculates frequency counts across all group expenses and updates the `frequentPayerIds` list on the group record:
- Top 5 members by pay frequency replace the list
- If there is a tie in frequency, alphabetical order is the tiebreaker
- The list is stored on the `Group` record in IndexedDB — not recomputed at render time

---

## Multiple Payers Mode

When more than one person contributed to paying a bill:

- User switches to "multiple payers" mode via an explicit toggle
- All group members are listed with an amount input next to each name
- User fills in the amounts for members who paid; others are left blank (treated as zero)
- **Validation:** submit is blocked until the sum of all entered amounts equals the total expense amount; an error is shown until they match

---

## Pre-selection Summary

| Scenario | Pre-selected |
|----------|-------------|
| Group has prior expenses | Most recent payer |
| New group, no expenses yet | Group creator (LocalUser) |

---

## Related

- [[domain-models]] — Group shape (frequentPayerIds field)
- [[indexeddb-schema]] — frequentPayerIds stored on the groups table
- [[split-types]] — the owes side of an expense (counterpart to paid-by)
