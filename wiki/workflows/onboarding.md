---
name: onboarding
description: Step-by-step first-launch flow for new users
metadata:
  type: workflows
---

# Onboarding Flow

Last updated: 2026-06-10

## Standard First-Launch Flow

For users opening the app for the first time without any imported data.

1. **Intro slides** — A short slideshow highlighting core app features. User swipes through at their own pace.
2. **Set up identity** — Enter name (mandatory) + choose an icon. Name is required before proceeding.
3. **Create a group** — Mandatory. User must create at least one group to enter the app.
4. **Select currency** — Pre-filled with INR (India-first default). User can change it. If left untouched, INR is used. Always results in a currency being set — not skippable but requires zero effort if INR is correct.
5. **Select categories** — **Mandatory: at least one.** A sensible default set is pre-selected (`defaultGroupCategories`); the creator can toggle these, add custom ones, or change the selection — but cannot proceed with zero, since every expense requires a category.
   - Screen explains: *"Pick the categories that make sense for this group. You can always add more later."*
   - More categories can be added anytime after creation.
6. **Add members** — Optional. The user is already auto-added to the group as a member (see invariant below). They can add others here, or simply continue with only themselves (a valid solo group). There is **no separate "Skip" button** — pressing "Save and Finish" without adding anyone is the solo path.
7. **Main app** — User lands on the group they just created.

---

## Invariants

- **Name is mandatory** — the app cannot proceed past step 2 without a name
- **Group creation is mandatory** — the app cannot proceed past step 3 without a group
- **At least one category is mandatory** — the categories step cannot be passed with zero selected; a default set is pre-selected so this needs no effort unless the user deselects everything
- **Adding members is optional** — a solo group (one member) is a valid and supported use case. See [[solo-group-support]]
- **Group creator is always auto-added as a Member** — when the group is created, a group-scoped Member record is created for the LocalUser automatically. The creator cannot be added again manually and cannot operate a group they are not part of.

---

## Persistence & Resume

The five setup steps (identity → group → currency → categories → members) **save to IndexedDB when each step's "Save and Proceed" button is pressed**, rather than committing everything at the end. Within a step, all input is held in a single central form (React/Zustand state) and **nothing is written on individual toggles or adds** — only Save and Proceed commits that step. Progress is tracked in the `"onboarding"` row of the `settings` store, holding a monotonic `lastCompletedStep` (plus `groupId` and `complete`). The Zustand store derives which step to render as the step after `lastCompletedStep`; the viewed step itself is not persisted (Back moves it in memory only, Save and Proceed advances the frontier).

Consequences:
- **Resumable** — closing the app mid-flow and reopening lands the user back on the last completed step, with all saved data intact. An in-progress, incomplete session arriving at the intro page is redirected straight into the setup flow.
- **Commit-on-button** — input on a step that was never confirmed with Save and Proceed is not persisted; this is intentional ("save only when you press the button").
- **Completion is an explicit flag** — `onboarding.complete`, not `localUser` presence, gates entry to the app (the user record is created at the very first step).

See [[onboarding-persistence]] for the full rationale, the step→save mapping, and the create-once group/currency handling.

---

## Alternative Entry Points (bypasses onboarding)

When a user arrives via a shared link, CSV, or ZIP, the standard onboarding is bypassed:

- **Link** — app opens, reads the hash, and loads the group in view-only mode directly. No setup required.
- **CSV / ZIP** — user imports the file and sees the group in view-only mode. No setup required to view.
- If the user then chooses "Import as my group," they must have name + icon set up. If not, they are prompted to set up their identity at that point before proceeding.

See [[import-export]] for full details on import modes.

---

## Related

- [[onboarding-persistence]] — per-step save + resume model backing this flow
- [[solo-group-support]] — why the add-members step is skippable and what solo groups mean
- [[import-export]] — alternative entry points via link, CSV, ZIP
- [[main-screen]] — where the user lands after onboarding
- [[domain-models]] — LocalUser and Member shapes
