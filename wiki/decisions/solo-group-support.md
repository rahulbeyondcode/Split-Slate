---
name: solo-group-support
description: Why single-member groups are valid and how onboarding handles the skip-members flow
metadata:
  type: decisions
---

# Decision: Solo Group Support

Last updated: 2026-05-17

## Decision

A group with only one member (the device owner) is valid. The "add members" step in onboarding is skippable. When the user skips, a prompt explicitly tells them: they can add members to the group at any time, or keep the group as a personal expense tracker with themselves as the only spender.

## Why

- The data model already supports 1-member groups — no new architecture needed.
- A solo group is useful: tracking personal trip expenses, logging costs before friends join, or simply using the app as a lightweight personal expense log.
- Making the skip path intentional (via a prompt) prevents users from thinking the app is broken or that they accidentally bypassed a required step.

## Onboarding Behavior

The "Add Members" step in the group creation flow has a visible "Skip" option. If skipped, a prompt explains:
> "You can add members to this group anytime. For now, this group will work as a personal expense tracker with only you as the spender."

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
