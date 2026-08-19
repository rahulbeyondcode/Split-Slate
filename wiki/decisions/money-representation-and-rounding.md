---
name: money-representation-and-rounding
description: How Split Slate stores money and deterministically allocates indivisible remainders
metadata:
  type: decisions
---

# Decision: Money Representation and Rounding

Purpose: prevent floating-point accounting errors while guaranteeing that every computed split
adds back to its expense total.

Last updated: 2026-08-20

## Implementation Status

Approved design, not implemented. The app has no expense create/update mutation or split
calculator. Monetary fields are typed as `number`, which cannot by itself enforce integer values;
the current currency formatter also treats its input as a major-unit amount. Currency metadata does
not yet expose each ISO 4217 currency's minor-unit exponent.

These gaps must be resolved before normal expense writes are enabled.

## Decision

Every persisted or derived **monetary** amount uses an integer count of the group's currency minor
unit.

Examples:

- INR 123.45 is stored as `12345` paise
- USD 12.50 is stored as `1250` cents
- JPY 500 is stored as `500` because JPY has no decimal minor unit
- BHD 1.250 is stored as `1250` fils because BHD uses three decimal places

The conversion factor comes from the currency's ISO 4217 minor-unit exponent; the application must
not assume that every currency has two decimals.

This applies to:

- `transactions.paid[].amount`
- `transactions.owes[].amount`
- expense totals derived from those arrays
- adjustment split values in `splitMeta[]`
- future settlement amounts

Shares and percentage metadata are ratios, not money, and therefore do not use minor units.

## Input and Formatting Boundary

- Parse user-entered decimal text into minor units without using binary floating-point arithmetic
  as the accounting representation.
- Reject precision beyond the selected currency's supported exponent rather than silently storing
  an ambiguous value.
- Persist and calculate only finite safe integers; validate with `Number.isSafeInteger` at the
  write boundary.
- Convert minor units back to major units only at the display boundary before calling currency
  formatting APIs.

## Deterministic Split Rounding

Equal, shares, percentage, and adjustment splits may produce fractional minor units. Split Slate
uses the **largest remainder method**:

1. Compute each participant's exact mathematical quota from the integer total.
2. Give each participant the floor of that quota in minor units.
3. Calculate how many minor units remain unallocated.
4. Assign one remaining unit at a time to participants in descending order of fractional
   remainder.
5. Break equal fractional remainders by ascending `memberId` so the result is stable across runs and
   devices.

The resulting `owes[]` values are stored explicitly. They are not recomputed during ordinary reads.

For adjustment splits, validate the exact final quotas as non-negative, then apply the same
allocation method to those final quotas. Exact-amount splits and payer contributions are already
entered in minor units and must sum exactly; they do not need calculated remainder allocation.

## Required Invariants

At an expense write boundary:

- every monetary amount is a finite safe integer
- no paid or final owed amount is negative
- every referenced member belongs to the expense's group
- `sum(paid[].amount) == sum(owes[].amount)`
- the common sum is the expense total

Intermediate adjustment metadata may be negative, but it cannot produce a negative final owed
amount.

## Why

- Decimal currency values cannot be represented reliably with unrestricted binary floating point.
- Integer totals make equality validation exact rather than tolerance-based.
- Largest-remainder allocation preserves the total while minimizing per-participant rounding
  error.
- A stable tie-break makes editing, import, tests, and future synchronization reproducible.

## Consequences

- Currency metadata must include or derive the ISO minor-unit exponent.
- Form parsing and currency formatting need explicit minor-unit conversion helpers.
- Split calculations need tests for zero-, two-, and three-decimal currencies.
- Import validation must reject non-integer monetary data in the current schema version or migrate
  it through an explicitly versioned legacy rule.
- Mixed-currency expenses remain out of scope; one group currency defines the unit for every
  expense in that group.

## Related

- [[domain-models]] — monetary fields on Expense transactions and adjustment metadata
- [[split-types]] — formulas that feed deterministic allocation
- [[expense-model-design]] — why final paid and owed values are persisted
- [[balance-calculation]] — integer transaction amounts consumed by balance helpers
- [[import-export]] — portable formats must retain integer amounts and currency metadata

