---
name: split-types
description: All supported split types — mechanics, UX behaviour, validation rules, and data storage
metadata:
  type: architecture
---

# Split Types

Last updated: 2026-05-18

## Overview

Every expense has a `splitType`. Regardless of which type is chosen, the user always selects **which members are affected** — it does not have to be the entire group. A group of 10 can split an expense among just 4 selected members.

The selected members and the computed amounts are stored in `transactions.owes[]`. For split types where the input values cannot be derived back from `owes[]` alone (shares, percentage, adjustment), the raw input values are stored in `splitMeta[]` so the expense can be accurately displayed and edited later.

---

## 1. Equal

**What it does:** Divides the total amount equally among all selected members.

**UX:** User selects members. System computes equal share automatically. Nothing else to enter.

**Formula:**
```
each_member_owes = total / number_of_selected_members
```

**splitMeta:** Not needed — the equal split is fully derivable from `owes[]`.

**Validation:**
- At least 1 member must be selected

---

## 2. Amount

**What it does:** User manually enters the exact amount each selected member owes.

**UX:**
- Each selected member gets an input field
- As you fill in amounts, the remaining unallocated amount is distributed equally among members whose fields are still empty — shown as a placeholder
- Placeholder values update dynamically as you type
- If a member's field is left blank (showing only a placeholder), the system treats the placeholder value as the real value on save

**Formula:**
```
remaining = total - sum(manually_entered_amounts)
placeholder_per_blank_member = remaining / number_of_blank_members
```

**splitMeta:** Not needed — `owes[]` stores the final amounts directly.

**Validation:**
- Sum of all entered amounts (including placeholders for blanks) must equal the total
- No individual amount can be negative

---

## 3. Shares

**What it does:** Each member is assigned a number of shares. The total is divided proportionally based on the share ratio.

**UX:** Each selected member gets a shares input (e.g., 1, 1, 2). System shows the computed amount for each member in real time.

**Formula:**
```
total_shares = sum(all_member_shares)
member_owes = (member_shares / total_shares) × total
```

**Example:** Total ₹400. Person A = 1 share, Person B = 1 share, Person C = 2 shares → 4 total shares → A = ₹100, B = ₹100, C = ₹200.

**splitMeta:** Stores `{ memberId, value: shares_count }` for each member — needed to reconstruct the ratio on view/edit.

**Validation:**
- All share values must be positive numbers (no zeros, no negatives)

---

## 4. Percentage

**What it does:** Each member is assigned a percentage of the total.

**UX:** Each selected member gets a percentage input. Running total shown — must reach exactly 100% to save.

**Formula:**
```
member_owes = (member_percentage / 100) × total
```

**splitMeta:** Stores `{ memberId, value: percentage }` for each member — needed to reconstruct percentages on view/edit.

**Validation:**
- All percentages must be positive
- Sum of all percentages must equal exactly 100%

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
- If it does: show error — *"[Name]'s adjustment makes their share negative — reduce it or increase the total"*
- Sum of all final shares is guaranteed to equal the total by the formula (no separate validation needed)

---

## splitMeta Summary

| Split Type | splitMeta stored | Why |
|------------|-----------------|-----|
| Equal      | No              | Derivable from owes[] |
| Amount     | No              | owes[] already has final amounts |
| Shares     | Yes (share count per member) | Ratio cannot be derived from owes[] |
| Percentage | Yes (percentage per member) | Percentage cannot be derived from owes[] |
| Adjustment | Yes (adjustment per member) | Adjustment cannot be derived from owes[] |

---

## Related

- [[domain-models]] — Expense shape (splitType, splitMeta, when fields)
- [[expense-model-design]] — why owes[] stores final computed amounts
- [[balance-calculation]] — how owes[] feeds into net balance computation
