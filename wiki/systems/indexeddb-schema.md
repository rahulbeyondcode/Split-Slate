---
name: indexeddb-schema
description: IndexedDB table structure, keys, and relationships for split-slate
metadata:
  type: systems
---

# IndexedDB Schema

Purpose: describe the persisted records, indexes, and implemented write boundaries.

Last updated: 2026-09-19

## Current Implementation Scope

`src/shared/configs/db.ts` currently declares these Dexie stores: `localUser`, `groups`, `people`,
`members`, `categories`, `tags`, `expenses`, `attachments`, and `settings`.

All schema revisions are currently declared as Dexie database version `1`. This is intentional
during active development: after a schema change, the local `split-slate` database is cleared and
the app starts against a fresh schema. Development data is disposable, so there is no supported
legacy database shape to migrate or backfill.

Versioned Dexie upgrades will become necessary only when the project starts preserving user data
across released schema changes. Until then, the reset-on-schema-change workflow is the supported
development lifecycle and the lack of migrations is not an implementation blocker.

App bootstrap currently calls the async store initializer without an error boundary or visible
failure state. A schema/opening failure can leave the route protector waiting indefinitely for
`initialized`.

## Tables

### `localUser`
Single-record store (only one local user per device).

| Field      | Type   | Notes          |
|------------|--------|----------------|
| id         | UUID   | primary key    |
| name       | string |                |
| icon       | string |                |

---

### `groups`

| Field            | Type     | Notes                                                              |
|------------------|----------|--------------------------------------------------------------------|
| id               | UUID     | primary key                                                        |
| name             | string   |                                                                    |
| icon             | string   | emoji character                                                    |
| currency         | string   | ISO 4217 code e.g. "INR"; defaults to "INR"; set at group creation |
| createdAt        | number   | unix ms                                                            |
| frequentPayerIds | UUID[]   | top-five memberIds ranked after each expense creation |

Initial value on group creation is `[creatorMemberId]`. Expense creation recalculates the ranking
and commits it atomically with the expense. See [[paid-by]] for selection and ranking behavior.

---

### `people`

Global device-local directory of people ("friends list"), reused across every group. The device owner has a row here sharing the `localUser` id. See [[global-people-directory]] and [[people-directory]].

| Field | Type   | Notes        |
|-------|--------|--------------|
| id    | UUID   | primary key  |
| name  | string |              |
| icon  | string | emoji        |

---

### `members`

A member links a group to a person — it stores no name/icon of its own; display is resolved through `personId`.

| Field    | Type   | Notes                         |
|----------|--------|-------------------------------|
| id       | UUID   | primary key                   |
| groupId  | UUID   | index → foreign key to groups |
| personId | UUID   | index → foreign key to people |

Indexes: `groupId` (members of a group), `personId` (memberships linked to a person). The current
person-deletion guard resolves memberships from hydrated state rather than querying that index.

---

### `expenses`

| Field         | Type    | Notes                                                              |
|---------------|---------|--------------------------------------------------------------------|
| expenseId     | UUID    | primary key                                                        |
| groupId       | UUID    | index → foreign key to groups                                      |
| expenseName   | string  |                                                                    |
| createdBy     | UUID    | memberId                                                           |
| categoryId    | UUID    | foreign key to categories — **mandatory**                          |
| tagIds        | UUID[]  | optional references to group tags; empty array if no tags apply    |
| createdAt     | number  | unix ms — set automatically by the app, never user-edited          |
| when          | number  | unix ms — user-entered date + time of the actual expense; defaults to now |
| splitType     | string  | `'equal' \| 'amount' \| 'shares' \| 'percentage' \| 'adjustment'` |
| splitMeta     | object[] | `{ memberId: UUID, value: number }[]` — ratios for shares/percentages, integer minor units for adjustments |
| transactions  | object  | `{ paid: [], owes: [] }` — monetary amounts use integer minor units |
| attachmentIds | UUID[]  | references to the attachments table; empty array if none           |

Index: `groupId` — used to fetch all expenses for a group.

Arrays and objects (`tagIds`, `splitMeta`, `transactions`, `attachmentIds`) are stored directly as
nested structured data. Expense creation, bootstrap hydration, the entry form, and the read-only
expense list are implemented. Expense editing and deletion remain pending.

Creation validates safe-integer currency minor units and equal paid/owed totals. Within one Dexie
transaction it rechecks persisted group, member/person, creator, active-category, and tag
references, checks the aggregate group-spending limit, and writes the expense and payer ranking.
The formatter consumes minor units, including currencies with zero or three decimal places. See
[[money-representation-and-rounding]] and [[state-management]].

---

### `attachments`

The declared table is intended to store receipt image blobs separately so expense records can load
without pulling image data.

| Field      | Type   | Notes                            |
|------------|--------|----------------------------------|
| id         | UUID   | primary key                      |
| expenseId  | UUID   | index → foreign key to expenses  |
| blob       | Blob   | image blob                        |
| mimeType   | string | e.g. `image/jpeg`, `image/png`   |
| createdAt  | number | unix ms                          |

Index: `expenseId` — used to fetch all attachments for a given expense.

The table and `Attachment` type exist, but attachment ingestion, compression, and store actions are
not implemented. Compression to a maximum dimension remains a target described by the import/export
design, not current behavior.

---

### `categories`

| Field    | Type    | Notes                         |
|----------|---------|-------------------------------|
| id       | UUID    | primary key                   |
| groupId  | UUID    | index → foreign key to groups |
| name     | string  |                               |
| icon     | string  | emoji character               |
| isActive | boolean | expense picker and creation validation honor this flag; management toggle remains planned |

Index: `groupId` — used to fetch categories for a group.

---

### `tags`

| Field   | Type   | Notes                         |
|---------|--------|-------------------------------|
| id      | UUID   | primary key                   |
| groupId | UUID   | index → foreign key to groups |
| name    | string | trimmed; unique per group ignoring case |
| color   | string | required six-digit hex color  |

Index: `groupId` — used to fetch all tags for a group.

Tags are optional from the expense perspective and have no `isActive` field. Tag deletion and
cleanup of referencing expenses selected from hydrated state commit in one IndexedDB transaction.
The cascade does not query persisted expenses again; stale-state limitations are documented in
[[tag-management]].

---

### `settings`

Single-row-per-domain store for app configuration and flow state. Each row is keyed by a fixed string `id` (never a generated UUID), and the row shape is a **discriminated union on `id`** — so each domain stays fully typed while sharing one table. New configuration domains are added as new row types, not new tables. See [[onboarding-persistence]] and [[category-settings-ui]].

#### `"onboarding"` row — setup-flow progress (resumable)

| Field             | Type             | Notes                                                              |
|-------------------|------------------|--------------------------------------------------------------------|
| id                | `'onboarding'`   | primary key — fixed constant                                       |
| lastCompletedStep | SetupStep\|null  | furthest step the user has completed (`identity \| group \| currency \| categories \| members`); **monotonic** — only ever moves forward; `null` before any step completes |
| groupId           | UUID\|null       | the in-progress group created during onboarding                    |
| complete          | boolean          | onboarding finished; gates app entry instead of `localUser` presence |

The currently-viewed step is **not** stored here — it is Zustand-only, derived on load as the step after `lastCompletedStep`. Holds flow-progress state only — deliberately separate from domain data rather than folded into `localUser`.

#### `"categories"` row — category configuration

| Field   | Type                          | Notes                                                       |
|---------|-------------------------------|------------------------------------------------------------|
| id      | `'categories'`                | primary key — fixed constant                               |
| master  | `{ name: string; icon: string }[]` | the full master category list, each with a preset emoji icon (user-editable in future) |
| default | string[]                      | names (subset of `master`) pre-selected when creating a group; icons resolved from `master` |

Both arrays are **seeded from code constants on first launch** (`SEED_MASTER_CATEGORIES`,
`SEED_DEFAULT_GROUP_CATEGORIES`) and read from the database thereafter. Their storage shape
supports future editing, but settings controls and a mutation to save those edits remain pending.
See [[category-settings-ui]].

---

## Access Pattern Summary

| Query                         | Table       | Index Used |
|-------------------------------|-------------|------------|
| All groups                    | groups      | none       |
| All people (friends list)     | people      | none       |
| Members of a group            | members     | groupId    |
| Groups a person belongs to    | members     | personId   |
| Expenses of a group           | expenses    | groupId    |
| Categories of a group         | categories  | groupId    |
| Tags of a group               | tags        | groupId    |
| Single expense by ID          | expenses    | primary    |
| Attachments for an expense    | attachments | expenseId  |

---

## Related

- [[domain-models]] — TypeScript shapes these tables correspond to
- [[state-management]] — Zustand store that wraps this persistence layer
- [[category-management]] — implemented category CRUD and planned activation-state UI
