---
name: money-representation-and-rounding
description: How Split Slate stores money and deterministically allocates indivisible remainders
metadata:
  type: decisions
---

# Decision: Money Representation and Rounding

Purpose: prevent floating-point accounting errors while guaranteeing that every computed split
adds back to its expense total.

Last updated: 2026-09-19

## Implementation Status

Implemented for expense creation. `shared/utils/money.ts` parses decimal strings with BigInt
arithmetic and derives ISO accounting precision for the supported currency list; locale display
defaults do not determine the accounting unit. Monetary outputs are safe integers. The shared
formatter consumes minor units, including existing overview and sidebar displays.

The split calculator uses exact integer quotas, largest remainders, and ascending member IDs for
ties. Shares/percentage inputs allow six decimal places and use scaled integer ratios. The form
and store reject invalid amounts and unbalanced contributions. Expense updates remain pending.

Existing development data is not automatically converted from major units. The project still uses
the documented disposable-development database lifecycle in [[indexeddb-schema]].

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

## Aggregate Limit

Expense creation caps total group spending at `Number.MAX_SAFE_INTEGER` minor units. The store
sums persisted paid amounts and the proposed expense with BigInt inside the same transaction as
the expense and payer-ranking writes. A total above the limit rejects the save with a visible
error and leaves the expense history and ranking unchanged; the form retains its inputs.

Individually valid expenses can otherwise overflow a derived total and make the safe-integer
formatter throw during rendering. With nonnegative balanced transactions, bounding total group
spending also bounds each member's cumulative paid, owed, and net amounts. Concurrent saves are
serialized by the transaction, so they cannot independently pass against an outdated total.

This guard applies to creation; it does not repair existing invalid development data. Future
expense updates and imports must enforce the same limit. See [[state-management]].

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
- total group spending after the write must not exceed `Number.MAX_SAFE_INTEGER` minor units

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
