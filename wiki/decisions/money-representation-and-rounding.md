---
name: money-representation-and-rounding
description: How Split Slate stores money and deterministically allocates indivisible remainders
metadata:
  type: decisions
---

# Decision: Money Representation and Rounding

Purpose: prevent floating-point accounting errors while guaranteeing that every computed split
adds back to its expense total.

Last updated: 2026-10-04

## Implementation Status

Implemented for expense creation, editing, filtering, display, and group currency relabeling.
`shared/utils/money.ts` parses decimal strings with BigInt arithmetic into fixed integer
hundredths for every supported currency. The formatter always shows two decimal places, regardless
of locale or ISO defaults. Monetary outputs remain safe integers.

The split calculator uses exact integer quotas, largest remainders, and ascending member IDs for
ties. Shares/percentage inputs allow six decimal places and use scaled integer ratios. The form
and store reject invalid amounts and unbalanced contributions for creation and updates.

Development IndexedDB was cleared before the fixed-hundredths change. At that time no saved records
or transfer files required money migration, so the transfer schema retained its version. This is a
historical migration decision, not a claim that the app has never been deployed. See
[[indexeddb-schema]].

## Currency-Independent Hundredths

- Accept at most two fractional digits for monetary input in every supported currency. Persist
  and calculate amounts as safe integer hundredths, including paid/owed rows and adjustment
  metadata; preserve exact integer allocation and balanced-split guarantees.
- Treat group currency as a display/grouping label, not the scale of persisted monetary amounts.
  Changing it when expenses exist requires confirmation that existing numeric amounts will be
  relabeled without exchange conversion. A saved `500.00` stays numerically `500.00`.
- Parsing, display, validation, and transfer use the same fixed scale. There is no automatic FX
  conversion and no per-expense currency field.

This decision favors understandable user-controlled currency labels over ISO-specific decimal
precision while keeping integer accounting rather than floating-point arithmetic.

## Decision

Every persisted or derived **monetary** amount uses integer hundredths, independent of currency.

Examples:

- INR 123.45 is stored as `12345`
- USD 12.50 is stored as `1250`
- JPY 500.00 is stored as `50000`
- BHD 1.25 is stored as `125`

The scale is always 100. A currency label change does not change the stored integers.

This applies to:

- `transactions.paid[].amount`
- `transactions.owes[].amount`
- expense totals derived from those arrays
- adjustment split values in `splitMeta[]`
- future settlement amounts

Shares and percentage metadata are ratios, not money, and therefore do not use hundredths.
Their validated decimal input is stored as text, while computation converts it directly to scaled
BigInt weights with six fractional digits and a maximum weight of `Number.MAX_SAFE_INTEGER`.
This preserves values such as `9007199254.740991` that would round if stored as a Number.
Adjustment metadata remains an integer hundredths number. Legacy numeric ratio records retain
their already-stored precision; the fix does not infer missing digits or silently clamp them.
See [[expense-edit-delete]].

## Input and Formatting Boundary

- Parse user-entered decimal text into hundredths without using binary floating-point arithmetic
  as the accounting representation.
- Reject more than two fractional digits for every supported currency.
- Persist monetary amounts only as finite safe integers; validate with `Number.isSafeInteger` at the
  write boundary.
- Convert hundredths back to entered numeric amounts only at the display boundary before calling currency
  formatting APIs.

## Aggregate Limit

Expense creation and editing cap total group spending at `Number.MAX_SAFE_INTEGER` hundredths. The store
sums persisted paid amounts and the proposed expense with BigInt inside the same transaction as
the expense and payer-ranking writes. A total above the limit rejects the save with a visible
error and leaves the expense history and ranking unchanged; the form retains its inputs. Updates
exclude the old expense before adding its replacement, so its total is not counted twice.

Individually valid expenses can otherwise overflow a derived total and make the safe-integer
formatter throw during rendering. With nonnegative balanced transactions, bounding total group
spending also bounds each member's cumulative paid, owed, and net amounts. Concurrent saves are
serialized by the transaction, so they cannot independently pass against an outdated total.

This guard applies to creation and updates; it does not repair existing invalid development data.
The implemented group-transfer import enforces the same limit. See [[import-export]] and
[[state-management]].

## Deterministic Split Rounding

Equal, shares, percentage, and adjustment splits may produce fractional hundredths. Split Slate
uses the **largest remainder method**:

1. Compute each participant's exact mathematical quota from the integer total.
2. Give each participant the floor of that quota in hundredths.
3. Calculate how many hundredths remain unallocated.
4. Assign one remaining hundredth at a time to participants in descending order of fractional
   remainder.
5. Break equal fractional remainders by ascending `memberId` so the result is stable across runs and
   devices.

The resulting `owes[]` values are stored explicitly. They are not recomputed during ordinary reads.

For adjustment splits, validate the exact final quotas as non-negative, then apply the same
allocation method to those final quotas. Exact-amount splits and payer contributions are already
entered in hundredths and must sum exactly; they do not need calculated remainder allocation.

## Required Invariants

At an expense write boundary:

- every monetary amount is a finite safe integer
- no paid or final owed amount is negative
- every referenced member belongs to the expense's group
- `sum(paid[].amount) == sum(owes[].amount)`
- the common sum is the expense total
- total group spending after the write must not exceed `Number.MAX_SAFE_INTEGER` hundredths

Intermediate adjustment metadata may be negative, but it cannot produce a negative final owed
amount.

## Why

- Decimal currency values cannot be represented reliably with unrestricted binary floating point.
- Integer totals make equality validation exact rather than tolerance-based.
- Largest-remainder allocation preserves the total while minimizing per-participant rounding
  error.
- A stable tie-break makes editing, import, tests, and future synchronization reproducible.

## Consequences

- Form parsing and currency formatting use a fixed hundredths scale for every currency label.
- Split calculations and filtering are tested with zero-, two-, and three-decimal ISO currency
  labels while accepting at most two decimal places for all of them.
- Import validation rejects non-integer monetary data in the current transfer schema.
- Mixed-currency expenses remain out of scope; one group currency defines the unit for every
  expense in that group.

## Related

- [[domain-models]] — monetary fields on Expense transactions and adjustment metadata
- [[split-types]] — formulas that feed deterministic allocation
- [[expense-model-design]] — why final paid and owed values are persisted
- [[expense-edit-delete]] — exact ratio edits and legacy numeric metadata limits
- [[balance-calculation]] — integer transaction amounts consumed by balance helpers
- [[import-export]] — portable formats must retain integer amounts and currency metadata
