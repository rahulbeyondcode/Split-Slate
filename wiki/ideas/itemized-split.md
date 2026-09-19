---
name: itemized-split
description: Idea for a 6th split type — bottom-up item-by-item assignment from a receipt
metadata:
  type: ideas
---

# Idea: Itemized Split

Purpose: preserve an uncommitted receipt-item split concept without implying a delivery schedule.

Last updated: 2026-09-19

**Status: exploratory, not committed.** Itemized entry and receipt OCR remain ideas under
[[product-roadmap]], with no approved version or delivery date.

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
- Receipt OCR could complement itemized entry by pre-filling line items, but both remain
  exploratory. Neither depends on an approved V2/V3 delivery commitment.
- Manual entry versus OCR-assisted entry requires separate prioritization and design.

## Related

- [[split-types]] — the 5 split types supported in MVP
- [[import-export]] — approved but pending receipt-attachment design
- [[product-roadmap]] — exploration status and delivery priorities
