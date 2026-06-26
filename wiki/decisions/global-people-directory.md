---
name: global-people-directory
description: Why people are a global device-local directory and group members link to them
metadata:
  type: decisions
---

# Decision: Global People Directory (Members Link to People)

Last updated: 2026-06-12

## Decision

There is a single **device-local directory of people** ("friends list"). A person is created once and reused across every group. A group **member** is no longer a self-contained name+icon record — it is a link from a group to a person. The same real person in two groups is the **same** person record, referenced twice.

This supersedes the earlier group-scoped-members decision, which gave every person a fresh identity per group. The old model is recorded below as the rejected alternative.

## Why

- **People recur — categories do not.** The same friends split bills across trips, flats, and dinners. Re-entering "Alice" for every group is the friction users complain about most.
- **Enables cross-group balances.** A global identity is the prerequisite for "what is my net with Alice across everything" — a feature the old model explicitly forgot.
- **Single edit surface.** Renaming or re-icon-ing a person updates every group automatically, because groups resolve display through the person link rather than storing their own copy.

## What Stays True (the old reasoning still holds)

- **Privacy-first:** people are still just name + icon. No email, phone, or account. The directory never leaves the device.
- **Offline-first:** nothing syncs. The directory is local to one device.

The old decision conflated *global* identity with *online* identity. A purely local directory keeps both privacy and offline guarantees while dropping only the per-group duplication.

## Two Deletion Scopes

Because a person is shared, "delete" has two distinct meanings, each with its own guard:

- **Remove from one group** — allowed only if that person is in none of *that group's* expenses.
- **Delete from the directory** — allowed only if that person is in *no expense in any group*. Deleting also prunes their group memberships and any frequent-payer references.

## Self

The device owner (LocalUser) is mirrored as a person in the directory, sharing the LocalUser id. This lets "you" participate in groups and appear in balances uniformly with everyone else.

## Rejected Alternative — Group-Scoped Members (previous model)

Every person got a fresh id per group; members stored their own name+icon; the same real person across two groups was two unrelated records.

- Rejected because it forced re-entry of the same people per group and made cross-group balances impossible.
- Its stated privacy/offline rationale is preserved by the local directory above, so nothing of value was lost.

## Rejected Alternative — Fully Global (expenses reference people directly, no member layer)

Drop the per-group member entirely and have expenses point straight at a person.

- Rejected as needless churn: it removes the in-group member key that expenses, frequent-payer tracking, and the per-group removal guard already use. Keeping a thin member-to-person link achieves the same outcome with far less surface touched.

## When This Changes

V3 device-based identity via invite links may link the same person across *devices* (true sync). That is a further step on top of this directory, still out of scope until sync is built.

## Related

- [[domain-models]] — Person and Member shapes
- [[people-directory]] — friends list, pick-at-creation, edit, delete flows
- [[member-management]] — the two-scope removal guards
- [[import-export]] — how a shared group reconciles people on import
