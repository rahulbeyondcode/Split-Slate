---
name: import-export
description: Durable group transfer through selective Link, CSV, and ZIP snapshots
metadata:
  type: decisions
---

# Decision: Import / Export Design

Purpose: define the implemented offline group-transfer contract and distinguish it from future
settlement sharing.

Last updated: 2026-09-26

## Decision

Import/export is a **durable group-transfer mechanism**. A recipient validates the package and
creates a new editable local group; there is no temporary read-only share mode. Transfer is a
snapshot, not synchronization: later changes on either device do not propagate or merge.

Future settlement sharing is a separate concern. Human-readable Link/PDF/Excel settlement summaries
must not reuse this group-transfer workflow or be described as group import. See
[[product-roadmap]].

## Export Questionnaire

Group Settings first reads a consistent persisted snapshot and rejects missing, duplicate, surplus,
or cross-expense receipt references even when receipts will be omitted. This keeps source and
omission counts trustworthy. It starts with only **Group information** selected. That required option includes the
group name, icon, currency, and creation metadata and cannot be unchecked. The sender may
independently select:

- categories
- tags
- members (with the referenced Person snapshots)
- expenses
- receipt attachments, shown only when an expense references at least one receipt

Expenses depend on categories and members. Selecting expenses automatically selects and locks both,
with an explanatory dialog; deselecting expenses unlocks them without clearing their current
selection. Tags remain optional, and omitted tag references are removed from transferred expenses.

Receipts depend on expenses. Selecting receipts automatically selects and locks expenses, which in
turn selects and locks categories and members. Deselecting receipts leaves the dependency content
selected but unlocks expenses. When receipts are omitted, transferred expenses contain no dangling
attachment references. The manifest records source and included counts so omission is explicit.

## Portable Dataset Contract

Schema version `1` carries:

- the required group snapshot and selection manifest
- source and included counts for categories, tags, members, expenses, and attachments
- selected categories and tags
- selected Member records and snapshots of their referenced global Person records
- selected expenses with paid/owed rows and exact split metadata
- selected attachment metadata; ZIP additionally carries the receipt blobs
- a SHA-256 digest of the canonical logical dataset

All formats reconstruct and validate the same logical contract. Validation covers schema version,
selection dependencies, declared counts, unique IDs, group ownership, complete references,
paid/owed equality, split metadata, and aggregate safe-integer spending. Any digest, schema, count,
or reference mismatch rejects the complete package before writes. Monetary values remain integer
minor units under [[money-representation-and-rounding]].

Source IDs remain in the package so its internal relationships can be validated. Import always
creates a fresh group UUID and fresh IDs for group-owned Member, Category, Tag, Expense, and
Attachment records, then rewrites every internal reference. The source group is never overwritten
or merged.

## Formats

### Transfer Link

- Validated JSON is zlib-compressed, base64url-encoded, and placed after `/import#v1.`.
- Link transfer is available only when receipts are not selected.
- The complete generated URL is capped at **32,000 characters** and decoded JSON at **256 KiB**.
- A regression fixture proves that 25 members, 25 categories, 25 tags, and 50 realistic expenses
  fit beneath the implemented URL limit.
- Current major browser engines support this size, but no guarantee is possible for every chat,
  email, SMS, scanner, or embedded webview. CSV or ZIP is the fallback when generation exceeds the
  limit or the chosen channel cannot carry the link.
- A truncated or changed payload fails decoding, integrity, or schema validation; partial data is
  never imported.
- The fragment is client-side but not encrypted. Anyone holding the link can decode the selected
  group data, so the UI displays a privacy warning.

### CSV

CSV is a reconstructable typed-row transfer without receipt blobs. It has one fixed union header and
typed rows for the manifest, group, people, members, categories, tags, expenses, and selected
attachment metadata. Nested values use JSON cells. Every cell is quoted, embedded quotes/newlines
follow CSV escaping, UTF-8 output starts with a BOM, and formula-leading text is tab-prefixed and
restored by the parser.

The export UI disables CSV while receipts are selected. A standalone CSV import also rejects a
manifest that claims to carry receipts because receipt bytes require ZIP.

### ZIP

ZIP is always available and is the only format enabled when receipts are selected. It contains:

- `manifest.json` — canonical versioned dataset
- `group.csv` — the same logical dataset as typed rows
- `README.txt`
- `attachments/index.json`
- selected receipt blobs under sanitized `attachments/` paths

Creation rejects missing or surplus receipt files. Import requires the manifest and CSV to describe
the same dataset, checks the declared archive paths, verifies each receipt's SHA-256 digest, and
rejects undeclared files. A ZIP without receipts remains a valid transfer option.

## Import Flow

`/import` is public so a fresh device can open a Link or choose a CSV/ZIP before standard onboarding.
The same route is reachable from the welcome carousel and the dashboard.

After complete validation, review shows the group name and included counts for categories, tags,
members, expenses, and receipts; it does not reveal item details or receipt previews. It also states
the destination name, omitted receipt count when applicable, identity choice, and default-category
behavior before the single **Import group** action.

Identity behavior:

- When members were transferred, the recipient chooses which member represents them or chooses
  **I'm not listed**.
- On a fresh device, selecting a transferred member creates LocalUser from that snapshot.
- On a fresh device with no transferred member selection, the import-specific identity form asks
  for name and icon and adds the recipient as a member.
- On an existing device, the current LocalUser is mapped to the chosen member or added as a new
  member when **I'm not listed** is selected.

If no categories were transferred, the device's configured default categories are created. No tags
or expenses are created when those sections were omitted. If the destination already has the same
group name, import uses `Name (2)`, then `Name (3)`, and so on. Existing groups are never replaced.

## People Reconciliation and Atomicity

People are global device-local records rather than group-owned records; see
[[global-people-directory]]. The member selected as the recipient is mapped to LocalUser's self
Person. For other transferred people, an existing identical ID/name/icon record is reused. An ID
collision with different details creates a new Person ID instead of overwriting local data; an
absent ID is inserted from the snapshot.

The complete import runs in one Dexie transaction across identity, groups, people, members,
categories, tags, expenses, attachments, and settings. It validates receipt metadata before the
transaction, remaps IDs, writes every selected record, verifies persisted collection counts, and
then commits. Any failure rolls back all import writes. Zustand is rehydrated only after commit.

A fresh or incomplete device is marked onboarding-complete and opens the imported group. An
already-completed device retains its existing onboarding progress record.

## Deliberate Limits

- Importing the same transfer twice creates two independent groups; there is no merge, replacement,
  or add-new-expenses mode.
- Integrity digests detect accidental change or corruption; they are not signatures or encryption.
- Transfer links are bounded client-side payloads, not server-hosted short links.
- Receipt ingestion/compression in the expense form remains pending even though valid existing
  attachment rows can be transferred in ZIP.

## Related

- [[domain-models]] — transferred entity shapes
- [[state-management]] — atomic import and rehydration boundary
- [[onboarding]] — fresh-device import identity path
- [[indexeddb-schema]] — destination tables
- [[global-people-directory]] — Person reconciliation
- [[money-representation-and-rounding]] — portable amount invariants
- [[main-screen]] — Group Settings export workflow
- [[product-roadmap]] — snapshot transfer and separate future settlement sharing
