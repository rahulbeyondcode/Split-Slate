---
name: indexeddb-schema
description: IndexedDB table structure, keys, and relationships for split-slate
metadata:
  type: systems
---

# IndexedDB Schema

Last updated: 2026-06-03

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

### `onboarding`

Single-row store tracking onboarding progress so the setup flow is resumable. Always read/written at the fixed key `'current'` — never a generated UUID. See [[onboarding-persistence]].

| Field             | Type             | Notes                                                              |
|-------------------|------------------|--------------------------------------------------------------------|
| id                | `'current'`      | primary key — fixed constant, one row only                         |
| lastCompletedStep | SetupStep\|null  | furthest step the user has completed (`identity \| group \| currency \| categories \| members`); **monotonic** — only ever moves forward; `null` before any step completes |
| groupId           | UUID\|null       | the in-progress group created during onboarding                    |
| complete          | boolean          | onboarding finished; gates app entry instead of `localUser` presence |

The currently-viewed step is **not** stored here — it is Zustand-only, derived on load as the step after `lastCompletedStep`. Only the Next action writes this row (saving the step's domain data and advancing `lastCompletedStep`); Back is a pure in-memory move. This store holds flow-progress state only — deliberately kept separate from domain data rather than folded into `localUser`.

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
