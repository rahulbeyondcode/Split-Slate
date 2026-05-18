---
name: indexeddb-schema
description: IndexedDB table structure, keys, and relationships for owe-it
metadata:
  type: systems
---

# IndexedDB Schema

Last updated: 2026-05-17

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

## Access Pattern Summary

| Query                         | Table       | Index Used |
|-------------------------------|-------------|------------|
| All groups                    | groups      | none       |
| Members of a group            | members     | groupId    |
| Expenses of a group           | expenses    | groupId    |
| Categories of a group         | categories  | groupId    |
| Single expense by ID          | expenses    | primary    |
| Attachments for an expense    | attachments | expenseId  |

---

## Related

- [[domain-models]] — TypeScript shapes these tables correspond to
- [[state-management]] — Zustand store that wraps this persistence layer
