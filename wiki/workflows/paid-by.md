---
name: paid-by
description: Paid-by selector UX, frequent payers list behaviour, and multi-payer input
metadata:
  type: workflows
---

# Paid-By

Purpose: explain payer selection defaults and ranking across expense mutations.

Last updated: 2026-10-09

## Overview

The expense form implements single-payer quick selection and an explicit multiple-payer mode.
New groups start with the creator selected; the remaining initial shortcuts are alphabetical.
After creation, editing, or deletion, the top-five ranking is persisted atomically with the expense. The selector reads
that stored ranking and can reveal every remaining group member.

The single-payer default is the first positive contributor on the most recently recorded expense (`createdAt`,
with expense ID as a stable tie-break). For multiple-payer history, the first contributor follows
stored transaction order. An otherwise hidden preselected payer is also shown. Missing historical
payers fall back to the local creator or first available member.
Both modes use emoji-and-name member pills. Single payer uses radio selection; multiple payers
uses checkboxes. The pills share the same compact size and reveal additional members with Show more.

---

## Single Payer (Default Mode)

### The Frequent Payers List

- Shows up to 5 unique members ranked by **how often they have paid** across the group's expense history (frequency count)
- The **most recent recorded payer** is pre-selected by default, even for a backdated expense
- "Show more" reveals all remaining group members beyond the top 5

### Initial State (New Group, No Expenses Yet)

When a group has no expenses:
1. Group creator occupies the first slot (pre-selected by default)
2. Remaining slots (up to 4) are filled by other group members in **alphabetical order by name**
3. If the group has fewer than 5 members total, the list is shorter accordingly

### How the List Updates Over Time

After each expense is created, edited, or deleted, the app recalculates frequency counts across all group expenses and updates the `frequentPayerIds` list on the group record:
- Top 5 members by pay frequency replace the list
- If there is a tie in frequency, alphabetical name order is the tiebreaker, then member ID
- Only positive contributions count; a member counts at most once per expense. Zero-frequency
  members can fill remaining slots after members who have paid
- The list is stored on the `Group` record in IndexedDB — not recomputed at render time
- Editing replaces that expense's old contributions; deletion ranks the remaining history. Both
  commit the ranking with the expense mutation, so a failed write cannot leave a mismatched ranking.
- Editing preserves `createdAt`, so correcting an older expense does not make it the most recently
  recorded one. The editor restores that expense's own payer amounts instead of applying defaults.

---

## Multiple Payers Mode

When more than one person contributed to paying a bill:

- Switching to Multiple payers on a new expense starts with no selected pills. Selecting or
  unselecting a member adds or removes their contribution row below the pills; unselecting clears
  that person's draft amount. Editing restores saved positive payers as selected.
- Each selected row shows its emoji and name, a live currency-formatted contribution, and a narrow
  center-aligned numeric input. With only one selected member, the input is disabled with the full total as its
  placeholder. With two or more, the fields are enabled: empty fields show a suggested amount as
  placeholder, and the remaining total is allocated evenly among empty fields using the same
  deterministic rounding as save. Typing changes the suggestions immediately.
- Tapping or focusing a suggested input does not clear any amounts. If typing into the last empty
  field would leave no field for the remainder, the earliest manually entered contribution is
  cleared and becomes the new suggested field. There is no separately saved "manual versus
  suggested" flag; reopening an edited expense fills every saved payer amount. Typing a different
  payer's contribution turns the last saved payer into the suggested remainder field; simply
  opening or focusing the form does not clear it.
- An over-total draft displays an immediate error. Submit still validates that paid contributions
  sum exactly to the expense total. Only positive contributions are saved; a selected member with
  a zero suggested remainder is omitted from the persisted paid list.
- Payer validation is shown once as plain red text near the contribution rows; submitting an invalid
  draft does not add a duplicate alert-styled message below the split editor.

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
