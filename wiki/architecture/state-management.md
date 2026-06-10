---
name: state-management
description: Zustand store shape and what is persisted vs computed
metadata:
  type: architecture
---

# State Management

Last updated: 2026-06-11

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

## Ephemeral State (in store, not persisted)

Not everything in the store is a persisted entity. The group draft is memory-only state that lives in the store but is never written to IndexedDB.

The draft is a flattened mirror of the in-progress group being built in the create (and, later, edit) group flow. While that flow is on screen, it pushes its form values into the draft on every change — effectively per-keystroke — so any subscriber sees the group taking shape in real time. The draft is seeded when the flow mounts and cleared when it unmounts, so leaving the flow leaves no residue.

Its sole purpose is to decouple the form from any live view of it. The form owns the source of truth while editing; the draft is a read-only projection other parts of the UI can subscribe to without coupling to the form. The first consumer is the activity panel's live preview, which swaps in for the activity feed on the group create/edit routes and re-renders as the draft changes. Because consumers subscribe to the draft rather than the form, the form pane itself does not re-render on these updates.

Two deliberate shape decisions:

- The draft's member list excludes the group creator, mirroring the form (where the creator is shown but not an editable entry). Consumers that need a complete roster reintroduce the creator from `localUser`. This keeps the draft a faithful projection of the form rather than a second place where creator logic lives.
- The draft setters are synchronous and touch no IndexedDB, unlike the entity actions which write to the database first. Nothing here is durable, so there is nothing to persist or resume — the contrast with [[onboarding-persistence]], where each step is saved so an interrupted first launch can resume.

---

## Persistence Strategy

- Zustand `persist` middleware → writes to IndexedDB via a custom storage adapter
- Dexie.js is an optional IndexedDB wrapper — decision pending on whether to use it or the raw IndexedDB API

See [[indexeddb-schema]] for the underlying table structure.

---

## Related

- [[domain-models]] — entity types stored in the store
- [[indexeddb-schema]] — persistence layer
