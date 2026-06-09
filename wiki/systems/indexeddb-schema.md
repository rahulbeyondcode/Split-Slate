---
name: indexeddb-schema
description: IndexedDB table structure, keys, and relationships for split-slate
metadata:
  type: systems
---

# IndexedDB Schema

Last updated: 2026-06-10

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
| frequentPayerIds | UUID[]   | up to 5 memberIds ranked by pay frequency; updated after each expense save |

Initial value on group creation: `[creatorMemberId, ...otherMemberIds_alphabetical]` (up to 5). See [[paid-by]] for update logic.

---

### `members`

| Field    | Type   | Notes                        |
|----------|--------|------------------------------|
| id       | UUID   | primary key                  |
| groupId  | UUID   | index → foreign key to groups|
| name     | string |                              |
| icon     | string |                              |

Index: `groupId` — used to fetch all members of a group.

---

### `expenses`

| Field         | Type    | Notes                                                              |
|---------------|---------|--------------------------------------------------------------------|
| expenseId     | UUID    | primary key                                                        |
| groupId       | UUID    | index → foreign key to groups                                      |
| expenseName   | string  |                                                                    |
| createdBy     | UUID    | memberId                                                           |
| categoryId    | UUID    | foreign key to categories — **mandatory**                          |
| tagIds        | UUID[]  | references to the tags table; empty array if no tags applied       |
| createdAt     | number  | unix ms — set automatically by the app, never user-edited          |
| when          | number  | unix ms — user-entered date + time of the actual expense; defaults to now |
| splitType     | string  | `'equal' \| 'amount' \| 'shares' \| 'percentage' \| 'adjustment'` |
| splitMeta     | object  | `{ memberId: UUID, value: number }[]` — raw split input for view/edit |
| transactions  | object  | `{ paid: [], owes: [] }`                                           |
| attachmentIds | UUID[]  | references to the attachments table; empty array if none           |

Index: `groupId` — used to fetch all expenses for a group.

All object fields (`splitMeta`, `transactions`, `attachmentIds`) are stored as nested JSON — IndexedDB supports this natively.

---

### `attachments`

Stores receipt image blobs. Kept separate from `expenses` so that expense records load without pulling image data (lazy loading).

| Field      | Type   | Notes                            |
|------------|--------|----------------------------------|
| id         | UUID   | primary key                      |
| expenseId  | UUID   | index → foreign key to expenses  |
| blob       | Blob   | compressed image (max ~1920px)   |
| mimeType   | string | e.g. `image/jpeg`, `image/png`   |
| createdAt  | number | unix ms                          |

Index: `expenseId` — used to fetch all attachments for a given expense.

Images are compressed on ingest before storage. No hard limit on count per expense.

---

### `categories`

| Field    | Type    | Notes                         |
|----------|---------|-------------------------------|
| id       | UUID    | primary key                   |
| groupId  | UUID    | index → foreign key to groups |
| name     | string  |                               |
| icon     | string  | emoji character               |
| isActive | boolean |                               |

Index: `groupId` — used to fetch categories for a group.

---

### `tags`

| Field   | Type   | Notes                         |
|---------|--------|-------------------------------|
| id      | UUID   | primary key                   |
| groupId | UUID   | index → foreign key to groups |
| name    | string |                               |

Index: `groupId` — used to fetch all tags for a group.

No `isActive` field — tags are either live or deleted (no deactivated state). On deletion the tag record is removed and `tagId` is stripped from all referencing expense records atomically. See [[tag-management]].

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
| Members of a group            | members     | groupId    |
| Expenses of a group           | expenses    | groupId    |
| Categories of a group         | categories  | groupId    |
| Tags of a group               | tags        | groupId    |
| Single expense by ID          | expenses    | primary    |
| Attachments for an expense    | attachments | expenseId  |

---

## Related

- [[domain-models]] — TypeScript shapes these tables correspond to
- [[state-management]] — Zustand store that wraps this persistence layer
