---
name: itemized-split
description: Idea for a 6th split type — bottom-up item-by-item assignment from a receipt
metadata:
  type: ideas
---

# Idea: Itemized Split

Last updated: 2026-05-18

## What It Is

A 6th split type where instead of starting with a total and dividing it, the user starts with individual line items (like a restaurant receipt) and assigns each item to one or more people. The system derives both the per-person amounts and the grand total from the items.

## How It Differs from Amount Split

| | Amount | Itemized |
|---|---|---|
| Starting point | Known total | Individual line items |
| Direction | Top-down (divide a total) | Bottom-up (sum up items) |
| Input | Per-person amounts | Per-item name, price, assignees |
| Mental model | "How do we split this?" | "Who ordered what?" |
| Use case | General expenses | Restaurant bills, shopping receipts |

## How It Would Work (UX)

1. User enters line items one by one:
   - Item name (e.g., "Pizza")
   - Item price (e.g., ₹400)
   - Who ordered it — select one or more members
   - If multiple members share an item, the item price is split equally among them
2. User keeps adding items until the receipt is fully entered
3. System totals all items → this becomes the expense total
4. System computes each member's share from the items assigned to them
5. The computed amounts populate `owes[]`

**Example:**
- Pizza ₹400 → Person A
- Pasta ₹350 → Person B
- Garlic bread ₹150 → Person A + Person B (split equally = ₹75 each)

Result: Person A owes ₹400 + ₹75 = ₹475. Person B owes ₹350 + ₹75 = ₹425. Total = ₹900.

## Data Storage

Itemized would need an extra field on the expense to store line items:

```ts
lineItems?: {
  id: UUID,
  name: string,
  price: number,
  assignedTo: UUID[]   // memberIds; price split equally among assignees
}[]
```

This is in addition to `splitMeta` and `owes[]`.

## Why Deferred

- Most complex split type to build — requires a dedicated line-item entry UI
- The 5 existing types (equal, amount, shares, percentage, adjustment) cover the vast majority of real-world cases
- Itemized is powerful but niche — primarily useful when the user has a physical receipt in front of them
- Receipt OCR (scanning a receipt to auto-fill line items) is already a V3 feature — itemized split makes the most sense to pair with OCR rather than as a standalone manual entry
- Add in V2 or alongside OCR in V3, whichever comes first

## Related

- [[split-types]] — the 5 split types supported in MVP
- [[import-export]] — receipt images can be attached to expenses (relevant when OCR is added)
