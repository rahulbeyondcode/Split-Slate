---
name: split-types
description: All supported split types — mechanics, UX behaviour, validation rules, and data storage
metadata:
  type: architecture
---

# Split Types

Purpose: explain implemented split calculations, inputs, rounding, and remaining presentation work.

Last updated: 2026-10-09

## Overview

The expense form, live previews, split calculator, validation, and save mutation implement all five
methods below. Final amounts and the necessary metadata are stored explicitly; ordinary reads do
not recalculate historical allocations. Shares and percentages accept positive decimal inputs with
up to six fractional digits, converted to integer weights before allocation. Values outside the
safe scaled-ratio range are rejected.

Validated shares/percentage inputs are persisted as trimmed decimal strings. Computation still
uses scaled BigInt weights; storage never converts these ratios to Number. This preserves exact
digits, including the maximum accepted shares value `9007199254.740991`, through detail, editing,
and reload. Leading/trailing decimal zeros are retained; surrounding whitespace is removed.
Older numeric ratio metadata remains readable, but precision already lost in those records cannot
be recovered automatically. See [[expense-edit-delete]].

In the entry flow, the user selects **which members are affected** — it does not have to be the
entire group. A group of 10 can split an expense among just 4 selected members.

The selected members with nonzero suggested percentages and their computed amounts are stored in
`transactions.owes[]`. For split types where the input values cannot be derived back from `owes[]`
alone (shares, percentage, adjustment), the resolved values are stored in `splitMeta[]` so the
expense can be accurately displayed and edited later.

The shared create/edit form presents the methods as Equal, Unequal, Shares, %, and Adjust at every
width. Unequal is the display label for the existing `amount` split type; saved data is unchanged.
Select all sits below the methods, followed by a prominent method-specific heading above the names;
blank percentage inputs show suggested values; the other split inputs have no placeholders. Each participant row includes their profile icon and is selectable
across its surface except over an editable input. The owed amount appears after the name and before
the narrow, center-aligned value input, or at the right edge for Equal; unselected rows show a currency-formatted
zero. Typing or pasting into split-value inputs keeps digits and one decimal point, plus an optional
leading minus sign for Adjust. This UI filter does not replace decimal-precision, range, and
balanced-split validation at save time.

A green, live summary appears immediately beneath the Unequal or Percentage heading only after at
least one selected participant has a value entered and the expense total and current split are
valid. Empty fields and suggested placeholders alone do not show it. Unequal summarizes the entered amount and how much
auto-splits across blank fields; Percentage summarizes entered and remaining percentages. Only
the numerical values (including the number of blank fields) are bold. Equal, Shares, and Adjust
have no green summary. Invalid split drafts show a single plain red message instead of a success
summary or a second alert-styled message at the bottom of the form.

## Implemented Rounding Policy

All monetary results use integer hundredths regardless of currency. Equal, shares, percentage, and adjustment
calculations allocate indivisible remainders with the largest-remainder method and break exact ties
by ascending `memberId`. This guarantees that the final stored owed amounts sum to the expense
total. See [[money-representation-and-rounding]] for fixed two-decimal input and validation rules.

---

## 1. Equal

**What it does:** Divides the total amount equally among all selected members.

**UX:** User selects members. System computes and shows each equal share automatically beside their
name. Nothing else to enter.

**Formula:**
```
each_member_owes = total / number_of_selected_members
```

**splitMeta:** Not needed — the equal split is fully derivable from `owes[]`.

**Validation:**
- At least 1 member must be selected

---

## 2. Unequal (stored as `amount`)

**What it does:** User manually enters the exact amount each selected member owes.

**UX:**
- Each selected member gets an input field
- As you fill in amounts, the remaining unallocated amount is distributed equally among members whose fields are still empty — shown in each person's owed-amount preview, not inside the input
- Suggested owed amounts update dynamically as you type; the inputs have no placeholders
- If a member's field is left blank, the system treats the displayed suggested amount as the real value on save
- Entered amounts and the remaining members' suggested amounts update beside each name as inputs
  change. If the entered sum is temporarily invalid, entered amounts remain visible while save
  validation reports the error.

**Formula:**
```
remaining = total - sum(manually_entered_amounts)
suggested_per_blank_member = remaining / number_of_blank_members
```

**splitMeta:** Not needed — `owes[]` stores the final amounts directly.

**Validation:**
- Sum of all entered amounts (including suggested amounts for blanks) must equal the total
- No individual amount can be negative

---

## 3. Shares

**What it does:** Each member is assigned a number of shares. The total is divided proportionally based on the share ratio.

**UX:** Each selected member gets a shares input (e.g., 1, 1, 2). System shows the computed amount
for each member in real time; while an entry is incomplete, valid entered shares receive a
provisional proportional preview and incomplete entries show zero.

**Formula:**
```
total_shares = sum(all_member_shares)
member_owes = (member_shares / total_shares) × total
```

**Example:** Total ₹400. Person A = 1 share, Person B = 1 share, Person C = 2 shares → 4 total shares → A = ₹100, B = ₹100, C = ₹200.

**splitMeta:** Stores `{ memberId, value: "shares_count" }` for each member — exact decimal text needed to reconstruct the ratio on view/edit.

**Validation:**
- All share values must be positive decimals with up to six fractional digits (no zeros, no negatives)
- Zero or out-of-range shares report "Shares must be positive and within range"; the message does
  not refer to percentages.

---

## 4. Percentage

**What it does:** Each member is assigned a percentage of the total.

**UX:** Each selected member gets a percentage input. Blank fields display an equal share of the
  remaining percentage as a placeholder. The allocation uses exact six-decimal percentages with
  leftover units assigned by ascending member ID, but placeholders, the green summary, and saved
  expense details round their displayed percentages to at most three decimal places (trailing zeros
  omitted). Rounded displays need not sum visibly to 100%; entered/editable fields, saved metadata,
  and monetary allocations retain the exact accepted values. The corresponding currency amounts
  update while typing and match the values saved. If the typed percentage exceeds what is left after the other entered
  fields, it is capped at that remainder (at most 100%). Focusing alone does not enter a value.
  The calculator requires the resolved percentages to total exactly 100%; if a suggested value is
  zero, that member is omitted from the saved owed amounts and metadata. Explicit zero input is
  still invalid. A numeric running percentage-total display remains pending.

**Formula:**
```
member_owes = (member_percentage / 100) × total
```

**splitMeta:** Stores `{ memberId, value: "percentage" }` for each member — exact decimal text needed to reconstruct percentages on view/edit.

**Validation:**
- All percentages must be positive decimals with up to six fractional digits
- Entered plus suggested percentages must sum to exactly 100%
- Percentage errors use percentage-specific wording: explicit zero reports "Percentages must be
  positive" and a mismatched completed split reports "Percentages must add up to 100%".

---

## 5. Adjustment

**What it does:** Starts with an equal base split, then applies individual adjustments (positive or negative) on top.

**UX:** User enters only the adjustment amounts — not the base. The base is computed automatically. Each selected member shows their final computed amount in real time.

**Formula:**
```
adjustment_sum = sum(all_adjustments)
base = total - adjustment_sum
base_per_member = base / number_of_selected_members
member_owes = base_per_member + member_adjustment
```

**Example:** Total ₹1000, 4 people, Person D had an extra juice ₹100.
- adjustment_sum = ₹100, base = ₹900, base_per_member = ₹225
- Person A, B, C = ₹225 each. Person D = ₹225 + ₹100 = ₹325. Total = ₹1000 ✓

**Negative adjustments:** Supported (e.g., someone got a discount, so their share is less). Not surfaced prominently in the UI but accepted if entered.

**splitMeta:** Stores `{ memberId, value: adjustment_amount }` for each member — needed to reconstruct adjustments on view/edit. Zero for members with no adjustment.

**Validation:**
- No member's final computed share (`base_per_member + adjustment`) can go below zero
- If it does, preview and submit validation report that an adjustment makes a member's share negative
- Sum of all final shares is guaranteed to equal the total by the formula (no separate validation needed)

---

## splitMeta Summary

| Split Type | splitMeta stored | Why |
|------------|-----------------|-----|
| Equal      | No              | Derivable from owes[] |
| Amount     | No              | owes[] already has final amounts |
| Shares     | Yes (decimal string per member) | Ratio cannot be derived from owes[] |
| Percentage | Yes (decimal string per member) | Percentage cannot be derived from owes[] |
| Adjustment | Yes (adjustment per member) | Adjustment cannot be derived from owes[] |

---

## Related

- [[domain-models]] — Expense shape (splitType, splitMeta, when fields)
- [[expense-model-design]] — why owes[] stores final computed amounts
- [[expense-edit-delete]] — exact ratio round-trips and legacy precision limits
- [[money-representation-and-rounding]] — fixed-hundredths storage and deterministic rounding
- [[balance-calculation]] — how owes[] feeds into net balance computation
