---
name: indexeddb-schema
description: IndexedDB table structure, keys, and relationships for split-slate
metadata:
  type: systems
---

# IndexedDB Schema

Last updated: 2026-08-20

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
| frequentPayerIds | UUID[]   | memberIds intended to rank frequent payers; expense-driven ranking is pending |

Initial value on group creation is currently `[creatorMemberId]`. Updating the ranking after an
expense save is planned but no expense-save action exists yet. See [[paid-by]] for the target UI and
ranking behavior.

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

Indexes: `groupId` (members of a group), `personId` (groups a person is in — used by the global delete guard).

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
| splitMeta     | object  | `{ memberId: UUID, value: number }[]` — raw input; adjustment values target minor units |
| transactions  | object  | `{ paid: [], owes: [] }` — monetary amounts target integer minor units |
| attachmentIds | UUID[]  | references to the attachments table; empty array if none           |

Index: `groupId` — used to fetch all expenses for a group.

All object fields (`tagIds`, `splitMeta`, `transactions`, `attachmentIds`) are stored as nested JSON
— IndexedDB supports this natively. The TypeScript shape, Dexie table, bootstrap hydration, and a
lightweight expense-list route exist; expense create/edit/delete actions and entry screens do not.

The approved monetary representation is integer currency minor units, including support for ISO
currencies whose exponent is not two. This is a target write-boundary rule rather than current
runtime enforcement: the schema stores JavaScript numbers, no expense mutation validates safe
integers, and the current display formatter expects major units. See
[[money-representation-and-rounding]].

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
| isActive | boolean | model/store support exists; management toggle and expense-picker filtering are planned |

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

Tags are optional from the expense perspective and have no `isActive` field. Deleting a tag and
removing its ID from every referencing expense happens in one IndexedDB transaction. See
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

Both arrays are **seeded from code constants on first launch** (`SEED_MASTER_CATEGORIES`, `SEED_DEFAULT_GROUP_CATEGORIES`), then DB-authoritative and editable thereafter. The master list moved here from a hardcoded constant so it can become user-editable. See [[category-settings-ui]].

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
