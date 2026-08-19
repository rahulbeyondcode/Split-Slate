---
name: solo-group-support
description: Why single-member groups are valid and how onboarding handles the skip-members flow
metadata:
  type: decisions
---

# Decision: Solo Group Support

Last updated: 2026-08-20

## Decision

A group with only one member (the device owner) is valid. The "add members" step in onboarding is
**optional** — the creator can finish with only themselves. There is **no separate "Skip" button**:
pressing "Save and Finish" without adding anyone produces a solo group. The implemented helper text
does not explicitly name the solo path, so that clarity portion of this decision remains open.

## Why

- The data model already supports 1-member groups — no new architecture needed.
- A solo group is useful: tracking personal trip expenses, logging costs before friends join, or simply using the app as a lightweight personal expense log.
- Explicitly explaining the solo path would prevent users from thinking the app is broken or that
  they accidentally bypassed a required step; the current helper only says people can be added later.

## Onboarding Behavior

The "Add Members" step in the group creation flow can be completed without adding anyone — "Save
and Finish" proceeds with just the creator. Its current helper text is:
> "You're already in this group. Pick from your friends or add someone new — you can always add them later."

This text permits the solo path but does not explicitly tell the user that finishing solo is valid.

See [[onboarding]] for the full group creation flow and step order.

## Tradeoff

- The "Balances" tab in a solo group is always empty (net = 0 when there is only one member) — this is expected and not a bug.
- The "who owes whom" output is also empty for solo groups — acceptable.

## What This Removes

The earlier assumption that a group requires ≥ 2 members before expenses can be added is dropped. There is no minimum member count.

## Related

- [[domain-models]] — Member shape; solo group means only 1 Member record linked to the group
- [[state-management]] — createGroup action does not auto-require a second member
- [[indexeddb-schema]] — no schema changes needed; groupId index on members handles 0 or more members per group
