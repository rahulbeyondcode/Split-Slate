---
name: settlement-recording
description: Device-local recording of external payments within one group
metadata:
  type: decisions
---

# Decision: Offline Payment Recording

Purpose: distinguish recorded external repayments from expenses, payment processing, and cross-group netting.

Last updated: 2026-10-10

## Decision

The device owner may record a payment made **outside Split Slate** between any two members of a
group. One record belongs to one group; the user divides a real payment covering multiple groups
into separate records themselves. A record stores payer, recipient, positive integer hundredths,
editable local date/time, recording member and time, and optional group tag IDs. It has no category
or split allocation. Records may be edited or deleted; deleting one does not reverse a real-world
transfer. There is no money movement, automatic confirmation, sync, currency conversion, or
cross-group allocation/netting. See [[domain-models]].

**Add payment** accepts any positive amount. **Settle up** preselects a suggested payer, recipient,
and amount. A value above the current suggested amount shows a warning but remains saveable; actual
overpayments can reverse a member's net position. Suggestions themselves are not records.
The Add, Settle up, and Edit actions open a payment modal. Payer and recipient use searchable
avatar-and-name group-member dropdowns labeled **Paid by** and **Received by**. The shared expense
date/time controls give new payments today's local date but require an explicit time; editing
restores the saved local date and time. See [[main-screen]].

Optional payment tags use compact native checkbox options with 12px-reference label text at every
screen width and a colour dot beside each tag name. The dot uses the saved tag colour and is
decorative; the tag name remains the checkbox's accessible label. Selection, keyboard handling,
and saved tag IDs are unchanged. Record, Settle up, and Edit share these controls. The colour/sizing
browser cases at mobile/tablet/desktop widths and in light/dark themes are added but not run under
the current execution pause. See [[selection-controls]] and [[tag-management]].

Balances add payments made to each payer's net and subtract payments received from each recipient's
net, without modifying expenses. Expense spending totals, categories, insights, and filtering remain
expense-only. Payments appear as green blocks with a transfer icon in unfiltered date-sorted group
history, recent Overview entries, and recorded-payment history on Balances. Expense filters and
non-date sorting hide payment blocks in the ledger with an explanation; Balances still shows them.
See [[balance-calculation]] and [[main-screen]].

The **Expenses** choice in selective group export also includes payment records, with member and
optional tag references remapped on fresh import. Version 2 group transfers include them; signed
version 1 transfers import with no payments. Whole-app backups preserve payment rows and payment
activity events and accept older backups without either field. Member/person removal checks payment
references; tag deletion clears payment tag IDs; group deletion removes its payment rows. See
[[import-export]], [[full-backup]], and [[indexeddb-schema]].

## Deferred

Cross-group settlement, automatic allocation of one transfer among groups, exchange conversion,
cross-group netting, and human-readable settlement sharing are separate future decisions. See
[[product-roadmap]].
