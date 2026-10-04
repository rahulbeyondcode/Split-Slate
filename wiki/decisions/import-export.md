---
name: import-export
description: Durable group transfer through selective Link, CSV, and ZIP snapshots
metadata:
  type: decisions
---

# Decision: Import / Export Design

Purpose: define the implemented offline group-transfer contract and distinguish it from future
settlement sharing.

Last updated: 2026-10-04

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
with an app-styled native modal that distinguishes the chosen content from the categories and members
added automatically. Deselecting expenses unlocks them without clearing their current selection.
Locked selections use muted rows and explanatory copy so they look unavailable even when
the user points at their labels. Tags remain optional, and omitted tag references are removed from
transferred expenses.

Receipts depend on expenses. Selecting receipts automatically selects and locks expenses, which in
turn selects and locks categories and members. The same modal shows receipts as the chosen content
and expenses, categories, and members as automatically included content. The modal can be
dismissed with its button or Escape. Deselecting receipts leaves the dependency content
selected but unlocks expenses. When receipts are omitted, transferred expenses contain no dangling
attachment references. The manifest records source and included counts so omission is explicit.

## Planned Same-Device Group Duplication

Group duplication is a planned next task, not an implemented export format.
It reuses this questionnaire's selectable group content and dependency rules, but creates a new
local group from the selected content rather than producing a Link, CSV, or ZIP. The original group
is not changed. The exact same-device identity, ID-remapping, and write behavior should be resolved
when designing the clone operation rather than inferred from cross-device import. See
[[product-roadmap]].

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
hundredths under [[money-representation-and-rounding]]. The transfer version is unchanged because
no pre-redesign transfer files or links need compatibility handling.

CSV and ZIP retain source IDs. Links replace the group ID and group-owned Member, Category, Tag,
Expense, and Attachment IDs (including every internal reference) with short, sequential strings
before compression, then reseal the logical dataset. Person IDs remain unchanged for directory
reconciliation. Both old UUID-bearing `v1` links and compact `v1` links validate and import; the
link is still unencrypted. Import always creates a fresh group UUID and fresh IDs for group-owned
records, then rewrites every internal reference. The source group is never overwritten or merged.

## Formats

### Transfer Link

- Validated JSON is zlib-compressed, base64url-encoded, and placed after `/import#v1.`.
- Link transfer is available only when receipts are not selected.
- The complete generated URL is capped at **32,000 characters** and decoded JSON at **256 KiB**.
- Group Settings checks link availability as the selected content changes. An oversized selection
  presents the link action as unavailable; selecting it opens an in-app explanation to download CSV
  or ZIP, or select less content. The actual creation still checks the current persisted snapshot
  before yielding a link. The UI does not present the character count to users.
- A regression fixture proves that 25 members, 25 categories, 25 tags, and 50 realistic expenses
  fit beneath the implemented URL limit.
- Link-only short group-owned IDs reduce the compressed URL length; tests compare the result with
  an old UUID-bearing link for a representative group. Person IDs are not shortened.
- Current major browser engines support this size, but no guarantee is possible for every chat,
  email, SMS, scanner, or embedded webview. CSV or ZIP is the fallback when generation exceeds the
  limit or the chosen channel cannot carry the link.
- A truncated or changed payload fails decoding, integrity, or schema validation; partial data is
  never imported.
- When receipts are selected, the link action remains explanatory rather than generating a link:
  it directs the user to ZIP or to deselect receipt files.
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
Exported group files use the sanitized group name with `.zip` or `.csv`; renaming does not change
their validity. Export and import screens warn users to keep the downloaded contents unchanged,
because changes can invalidate the transfer. The group import picker tells users which kind of file
to find. Choosing a whole-app backup ZIP here shows a **Restore app backup** link instead of a
missing-CSV error; an unrelated or damaged ZIP produces a plain-language error. Conversely, the
restore screen directs group ZIP and CSV files to **Import group**; see [[full-backup]].

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
- The selected source member is always remapped to the recipient's local Person, even when their
  source member and Person IDs differ between transfers. Each new group gets a distinct member ID.

If no categories were transferred, the device's configured default categories are created. No tags
or expenses are created when those sections were omitted. If the destination already has the same
group name, import uses `Name (2)`, then `Name (3)`, and so on. Existing groups are never replaced.

## People Reconciliation and Atomicity

People are global device-local records rather than group-owned records; see
[[global-people-directory]]. The member selected as the recipient is mapped to LocalUser's self
Person. For other transferred people, an existing identical ID/name/icon record is reused. An ID
collision with different details creates a new Person ID instead of overwriting local data.

A different source Person ID with the same case-insensitive name as a local contact is never merged
by name alone. Before import, a modal lists the incoming person with the source group and existing
same-name contacts with their groups. The recipient explicitly chooses **same person** to reuse an
existing contact, or **different people** and distinct final names. They can rename the incoming
person, the existing person, or both. Renaming an existing Person also changes their name in every
other group; the modal warns about this. Same-name people within a transfer also require distinct
names. Cancel writes nothing. Final names, targets, and one-person-per-group membership are
revalidated against persisted data inside the import transaction; unresolved or duplicate names
abort the entire import. A fresh import may still reuse a Person ID with an exact matching snapshot.

The complete import runs in one Dexie transaction across identity, groups, people, members,
categories, tags, expenses, attachments, and settings. It validates receipt metadata before the
transaction, remaps IDs, applies approved contact renames, writes every selected record, verifies persisted collection counts, and
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
