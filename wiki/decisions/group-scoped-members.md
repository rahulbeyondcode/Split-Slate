---
name: group-scoped-members
description: Why members have no global identity and are scoped per group
metadata:
  type: decisions
---

# Decision: Group-Scoped Members (No Global User in MVP/V2)

Last updated: 2026-05-17

## Decision

There is no global user model in MVP or V2. A "member" exists only inside a group. The same real person added to two groups gets two separate `memberId` UUIDs.

## Why

- **Privacy-first:** No identity required. Users add people by name only — no email, phone, or account.
- **Offline-first:** Identity across devices requires a sync mechanism, which is explicitly deferred to V3.
- **Simplicity:** Avoids identity resolution, merging, and "is this the same person?" logic entirely.

## Tradeoff

- Same person across groups → duplicate entries → no cross-group balance view (acceptable for MVP)
- If a user is renamed in one group, other groups are unaffected

## When This Changes

V3 introduces device-based identity via invite links. At that point, a `deviceId` or `userId` may be introduced to link the same real person across groups — but this is out of scope until sync is built.

## Related

- [[domain-models]] — Member shape (group-scoped)
- [[state-management]] — no global user in store (only localUser for the device owner)
