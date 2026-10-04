# Group Creation

One-line purpose: the standalone flow for creating a new group after onboarding is complete.

Last updated: 2026-10-04

## Relationship to onboarding

Group creation and onboarding share the same building blocks. The reusable steps — name/icon, currency, categories, and members — are owned by the group-creation domain. Onboarding is a superset: it adds an identity step in front and layers on per-step persistence and resume. The standalone flow reuses the steps directly, with none of that onboarding machinery.

This means the two flows present the same screens for the shared steps, and a change to any shared step affects both. Only copy that must differ (e.g. "Create your first group" vs "Create a group") is parameterised per flow.

## The flow

Four steps, in order: group (name + icon), currency, categories (at least one, defaults pre-selected), members (optional — the creator is always in the group, so a solo group is valid). Each step validates its own slice before advancing. Back is available; the final action is "Create group".

The creator is not added as a member in this flow's member step — they are added automatically when the group is created (see [[domain-models]] invariant on the creator member).

## Create-on-finish

Nothing is written until the final "Create group" action. Up to that point the form is in-memory,
with a separate memory-only draft mirrored into the Zustand store for live preview. Abandoning the
flow before that action leaves no partial group, categories, members, or people behind.

The final action starts a sequence of independent database writes; it is not one atomic Dexie
transaction. `createGroup` writes the group row and then the creator member row separately; the
Zustand group/member state is updated only after both succeed. Categories and selected member links
are written afterward, one at a time. A newly entered person is added to the global directory
immediately before that person's member link. If a later write fails, earlier successful database
writes remain saved (including a group without its creator member if that second write fails).
"Create-on-finish" describes when persistence begins, not an all-or-nothing commit guarantee.

This is the deliberate contrast with onboarding, which persists each step as it completes so an interrupted first-launch can resume. A returning user creating an Nth group has no resume need, so the simpler create-on-finish model applies.

After creation the user lands on the dashboard, where the new group appears. (The in-group view is a separate, later destination.)

## Related
- [[onboarding]] — the first-launch superset flow
- [[category-management]] — category selection rules reused here
- [[solo-group-support]] — why the members step is optional
- [[domain-models]] — group and member shapes
