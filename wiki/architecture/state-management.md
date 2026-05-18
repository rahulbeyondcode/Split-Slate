---
name: state-management
description: Zustand store shape and what is persisted vs computed
metadata:
  type: architecture
---

# State Management

Last updated: 2026-05-18

## Technology

Zustand v5 — single global store, persisted to IndexedDB.

---

## Planned Store Shape

```ts
interface AppStore {
  // Persisted entities
  localUser: LocalUser | null
  groups: Group[]         // each Group includes frequentPayerIds[]
  members: Member[]       // all members across all groups
  expenses: Expense[]     // all expenses; each includes when, splitType, splitMeta, attachmentIds
  categories: Category[]

  // Actions — LocalUser
  setLocalUser: (user: LocalUser) => void

  // Actions — Groups
  createGroup: (name: string, icon: string, currency: string) => Group   // also creates a Member record for LocalUser; initialises frequentPayerIds
  deleteGroup: (groupId: UUID) => void                  // permanent; cascades members, expenses, categories, attachments

  // Actions — Members
  addMember: (groupId: UUID, name: string, icon: string) => Member
  editMember: (memberId: UUID, name: string, icon: string) => void
  removeMember: (groupId: UUID, memberId: UUID) => void  // blocked if member has any expense involvement; cleans frequentPayerIds

  // Actions — Expenses
  addExpense: (expense: Omit<Expense, 'expenseId' | 'createdAt'>) => void   // updates frequentPayerIds after save
  editExpense: (expenseId: UUID, updates: Partial<Omit<Expense, 'expenseId' | 'groupId' | 'createdAt'>>) => void
  deleteExpense: (expenseId: UUID) => void                                    // cascades attachments

  // Actions — Categories
  addCategory: (groupId: UUID, name: string) => Category
  editCategory: (categoryId: UUID, name: string) => void
  deactivateCategory: (categoryId: UUID) => void
  reactivateCategory: (categoryId: UUID) => void
}
```

---

## Computed (not stored)

These are derived at read time, never stored:

- Net balances per member → computed from expenses via [[balance-calculation]]
- "Who owes whom" list → derived from net balances
- Members of a specific group → filtered from `members[]` by `groupId`
- Expenses of a specific group → filtered from `expenses[]` by `groupId`

---

## Persistence Strategy

- Zustand `persist` middleware → writes to IndexedDB via a custom storage adapter
- Dexie.js is an optional IndexedDB wrapper — decision pending on whether to use it or the raw IndexedDB API

See [[indexeddb-schema]] for the underlying table structure.

---

## Related

- [[domain-models]] — entity types stored in the store
- [[indexeddb-schema]] — persistence layer
