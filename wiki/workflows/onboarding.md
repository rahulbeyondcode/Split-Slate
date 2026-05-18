---
name: onboarding
description: Step-by-step first-launch flow for new users
metadata:
  type: workflows
---

# Onboarding Flow

Last updated: 2026-05-18

## Standard First-Launch Flow

For users opening the app for the first time without any imported data.

1. **Intro slides** — A short slideshow highlighting core app features. User swipes through at their own pace.
2. **Set up identity** — Enter name (mandatory) + choose an icon. Name is required before proceeding.
3. **Create a group** — Mandatory. User must create at least one group to enter the app.
4. **Select currency** — Pre-filled with INR (India-first default). User can change it. If left untouched, INR is used. Always results in a currency being set — not skippable but requires zero effort if INR is correct.
5. **Select categories** — Skippable. Creator picks which categories from the app master list apply to this group.
   - Screen explains: *"Choose the categories that make sense for this group. You'll pick from these when adding expenses — keeping the list short means faster entry. You can always add more categories later."*
   - If skipped: group starts with no categories; any member can add them later.
6. **Add members** — Skippable. The user is already auto-added to the group as a member (see invariant below). They can add others here or skip.
   - If skipped: a prompt explains — *"You can add members to this group anytime. For now, this group will work as a personal expense tracker with only you as the spender."*
7. **Main app** — User lands on the group they just created.

---

## Invariants

- **Name is mandatory** — the app cannot proceed past step 2 without a name
- **Group creation is mandatory** — the app cannot proceed past step 3 without a group
- **Adding members is optional** — a solo group (one member) is a valid and supported use case. See [[solo-group-support]]
- **Group creator is always auto-added as a Member** — when the group is created, a group-scoped Member record is created for the LocalUser automatically. The creator cannot be added again manually and cannot operate a group they are not part of.

---

## Alternative Entry Points (bypasses onboarding)

When a user arrives via a shared link, CSV, or ZIP, the standard onboarding is bypassed:

- **Link** — app opens, reads the hash, and loads the group in view-only mode directly. No setup required.
- **CSV / ZIP** — user imports the file and sees the group in view-only mode. No setup required to view.
- If the user then chooses "Import as my group," they must have name + icon set up. If not, they are prompted to set up their identity at that point before proceeding.

See [[import-export]] for full details on import modes.

---

## Related

- [[solo-group-support]] — why the add-members step is skippable and what solo groups mean
- [[import-export]] — alternative entry points via link, CSV, ZIP
- [[main-screen]] — where the user lands after onboarding
- [[domain-models]] — LocalUser and Member shapes
