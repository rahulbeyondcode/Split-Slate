---
name: state-management
description: Zustand store shape and what is persisted vs computed
metadata:
  type: architecture
---

# State Management

Last updated: 2026-08-20

## Technology

Zustand v5 — single global store, backed by IndexedDB through Dexie.

The public API is `useStore` from `@/shared/configs/store`. The implementation is split into
domain slices under `src/shared/configs/store/` so each feature owns its state defaults and actions:

- `app-slice.ts` — app bootstrap, hydration, and shared entity/settings loading
- `people-slice.ts` — `localUser`, people directory, and person mutations
- `groups-slice.ts` — groups, members, group mutations, and member mutations
- `categories-slice.ts` — group categories plus master/default category settings
- `tags-slice.ts` — group-scoped tag records and atomic expense-reference cleanup
- `onboarding-slice.ts` — onboarding flow state and progress actions
- `group-draft-slice.ts` — memory-only create-group draft for live preview

The slices are composed in `src/shared/configs/store/index.ts` into one Zustand store. Components
still import one `useStore`; the split is an implementation boundary, not separate runtime stores.

---

## Current Store Shape

```ts
interface AppStore {
  // Persisted entities
  localUser: LocalUser | null
  people: Person[]
  groups: Group[]         // each Group includes frequentPayerIds[]
  members: Member[]       // all members across all groups
  expenses: Expense[]     // all expenses; each includes when, splitType, splitMeta, attachmentIds
  categories: Category[]
  tags: Tag[]

  // App bootstrap
  initialized: boolean
  init: () => Promise<void>

  // Actions — Groups
  createGroup: (name: string, icon: string, currency: string) => Promise<{ group: Group; creatorMember: Member }>
  updateGroup: (groupId: UUID, patch: Partial<Group>) => Promise<Group>

  // Actions — People
  setLocalUser: (name: string, icon: string) => Promise<LocalUser>  // also upserts the self Person
  addPerson: (name: string, icon: string) => Promise<Person>
  updatePerson: (personId: UUID, patch: Partial<Omit<Person, 'id'>>) => Promise<Person>
  removePerson: (personId: UUID) => Promise<void>  // blocked if any linked member has expense involvement

  // Actions — Members
  addMember: (groupId: UUID, personId: UUID) => Promise<Member>
  removeMember: (memberId: UUID) => Promise<void>  // blocked if member has any expense involvement; cleans frequentPayerIds

  // Actions — Categories
  masterCategories: { name: string; icon: string }[]
  defaultGroupCategories: string[]
  addCategory: (groupId: UUID, name: string, icon: string) => Promise<Category>
  updateCategory: (categoryId: UUID, patch: Partial<Pick<Category, 'name' | 'icon' | 'isActive'>>) => Promise<Category>
  removeCategory: (categoryId: UUID) => Promise<void>

  // Actions — Tags
  addTag: (groupId: UUID, name: string, color: string) => Promise<Tag>
  updateTag: (tagId: UUID, patch: { name?: string, color?: string }) => Promise<Tag>
  removeTag: (tagId: UUID) => Promise<void>   // atomically removes tagIds references from expenses

  // Onboarding flow
  onboardingStep: SetupStep
  onboardingLastCompletedStep: SetupStep | null
  onboardingGroupId: UUID | null
  onboardingComplete: boolean
  updateOnboarding: (patch: Partial<Omit<OnboardingSettings, 'id'>>) => Promise<void>
  advanceOnboarding: (fromStep: SetupStep) => Promise<void>
  setOnboardingStep: (step: SetupStep) => void

  // Ephemeral group draft (create flow today; edit support planned)
  groupDraft: GroupDraft | null
  setGroupDraft: (draft: GroupDraft | null) => void
  clearGroupDraft: () => void
}
```

---

## Computed (not stored)

These are derived at read time, never stored:

- Net balances per member → computed from expenses via [[balance-calculation]]
- "Who owes whom" list → derived from net balances
- Members of a specific group → filtered from `members[]` by `groupId`
- Expenses of a specific group → filtered from `expenses[]` by `groupId`
- Tags of a specific group → filtered from `tags[]` by `groupId`

---

## Ephemeral State (in store, not persisted)

Not everything in the store is a persisted entity. The group draft is memory-only state that lives in the store but is never written to IndexedDB.

The draft is a flattened mirror of the in-progress group being built in the create flow. A future
edit flow can reuse it, but the router currently registers only `/groups/new`, not a group edit
route. While creation is on screen, it pushes form values into the draft on every change —
effectively per-keystroke — so any subscriber sees the group taking shape in real time. The draft
is seeded when the flow mounts and cleared when it unmounts, so leaving the flow leaves no residue.

Its sole purpose is to decouple the form from any live view of it. The form owns the source of truth
while editing; the draft is a read-only projection other parts of the UI can subscribe to without
coupling to the form. The current consumer is the activity panel's live preview on the create-group
route. Its route matcher anticipates a future edit route, but no such route is registered. Because
consumers subscribe to the draft rather than the form, the form pane itself does not re-render on
these updates.

Two deliberate shape decisions:

- The draft's member list excludes the group creator, mirroring the form (where the creator is shown but not an editable entry). Consumers that need a complete roster reintroduce the creator from `localUser`. This keeps the draft a faithful projection of the form rather than a second place where creator logic lives.
- The draft setters are synchronous and touch no IndexedDB, unlike the entity actions which write to the database first. Nothing here is durable, so there is nothing to persist or resume — the contrast with [[onboarding-persistence]], where each step is saved so an interrupted first launch can resume.

---

## Persistence Strategy

- Dexie is the authoritative persistence layer over IndexedDB.
- Entity mutations write to Dexie before updating their corresponding Zustand state.
- Category and tag mutations enforce their documented name/color, uniqueness, and deletion guards.
  Group, person, and member actions do not uniformly validate names, referenced IDs, duplicate
  memberships, self deletion, or creator retention; their documented UI constraints are not all
  store invariants.
- Zustand holds the hydrated in-memory view of persisted entities; it does not use `persist` middleware.
- `init()` hydrates entities and settings from IndexedDB and seeds missing settings rows.
- Tag deletion is explicitly wrapped in a Dexie transaction, so deleting the tag and removing its
  expense references is atomic.
- Other composed operations are sequential rather than atomic. Examples include creating a group
  and its creator member, mirroring the local user into `people`, deleting a person and cleaning up
  member/group references, and the standalone group-creation submission. If a later write fails,
  earlier successful database writes are retained.

The database definition lives in `src/shared/configs/db.ts`.

See [[indexeddb-schema]] for the underlying table structure.

---

## Related

- [[domain-models]] — entity types stored in the store
- [[indexeddb-schema]] — persistence layer
