---
name: onboarding-persistence
description: Why onboarding saves per-step to IndexedDB and resumes from stored progress, instead of a single deferred commit
metadata:
  type: decisions
---

# Onboarding Persistence — Per-Step Save + Resume

Last updated: 2026-06-03

## Decision

The onboarding setup flow persists **each step to IndexedDB as it is completed**, syncs that write into the Zustand store, and tracks progress in a dedicated single-row record so the flow is **resumable across app reloads**. The store is the single source of truth for which step renders.

This replaces the earlier **deferred single-commit** model, where all input was held in local React state and written to IndexedDB only at the final step.

## Why

The deferred model had three problems:
- **Total loss on abandon** — closing the app before the final "Done" persisted nothing.
- **No rollback on partial failure** — the final commit ran several independent writes (`setLocalUser → createGroup → addCategories → addMember×N`); a mid-sequence failure left a half-saved group with no cleanup.
- **Not resumable** — there was no record of progress to return to.

Per-step save makes every completed step durable immediately and lets the user resume exactly where they left off.

## How It Works

### Progress record — a dedicated `onboarding` store
A new IndexedDB object store, `onboarding`, alongside the existing domain stores. It keeps flow-progress state **separate from domain data** (not folded into `localUser`). It holds exactly one row, read/written at a fixed key `'current'`:

```ts
{
  id: 'current',
  lastCompletedStep: SetupStep | null, // furthest completed step — monotonic
  groupId: string | null,              // the in-progress group
  complete: boolean
}
```

`SetupStep` = `'identity' | 'group' | 'currency' | 'categories' | 'members'`. The store is structurally ordinary (`id`-keyed like the others); only its usage is single-row — we always `get`/`put` at `'current'` rather than generating a UUID per record.

**Only `lastCompletedStep` is persisted; the currently-viewed step is Zustand-only.** The flow is strictly linear with no step-bypass, so being on a step already implies every earlier step is done — the viewed step does not need persisting. On load it is derived as the step after `lastCompletedStep`.

- **Next** writes the row: saves the step's domain data, then advances `lastCompletedStep = max(lastCompletedStep, viewedStep)`.
- **Back** is a pure in-memory Zustand move (decrement the viewed step); it does not touch IndexedDB.

`lastCompletedStep` is **monotonic** — clamped forward via `max` so it never rewinds. This matters when the user walks forward several steps, goes Back to edit an earlier one, and clicks Next: the edited data is re-saved, but the frontier stays at the furthest step reached, so resume still lands at the true frontier instead of re-walking already-completed steps. No cascade-invalidation is needed because later steps (categories, members) do not depend on the values of earlier ones.

### Step → save mapping
| Step | Persisted write |
|------|-----------------|
| identity | `setLocalUser` (put-upsert — reuses id on Back-edit) |
| group | `createGroup(name, icon, "INR")` **once** (also auto-creates the creator Member); Back-edits call `updateGroup` |
| currency | `updateGroup(groupId, { currency })` |
| categories | live `addCategory` / `removeCategory` per toggle |
| members | `addMember` / `removeMember` per row; final "Done" sets `complete: true` |

The group is created at the **group** step with the default `"INR"` currency (a group row requires a currency, but currency is chosen one step later); the **currency** step then updates it. The create-once guard (`groupId === null`) ensures the auto-created creator Member is never duplicated when the user navigates Back and edits.

### Completion signal moved off `localUser`
Previously `localUser` presence meant "onboarded". Per-step save creates `localUser` at step 1, so completion is now an explicit `onboarding.complete` flag, exposed by the store. Route protection reads this flag, not `localUser`. **Back-compat:** an existing user with a `localUser` but no onboarding row is treated as already complete.

### Resume
On launch, `init()` hydrates the onboarding row into the store; the setup flow renders the step after `lastCompletedStep` (or `identity` when it is `null`). Arriving at the intro page with an in-progress, incomplete session redirects straight into `/onboarding/setup` (auto-resume). Skipping a step still persists prior data (saves are live), so Skip no longer discards anything.

## Related

- [[onboarding]] — the step-by-step flow this persistence model backs
- [[state-management]] — Zustand store shape and thunks
- [[indexeddb-schema]] — the `onboarding` store
- [[solo-group-support]] — why the members step is skippable
