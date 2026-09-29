---
name: full-backup
description: One local ZIP for device-wide backup and destructive whole-app restore
metadata:
  type: decisions
---

# Decision: Whole-App Backup and Restore

Purpose: distinguish device recovery from selective, fresh-copy group transfers.

Last updated: 2026-09-29

## Scope

Settings downloads one versioned ZIP with every SplitSlate IndexedDB table: identity, global
people directory, groups, memberships, categories, tags, expenses, receipts (including blobs), and
settings. It also includes the app's saved light/dark theme. The ZIP is a full local snapshot, not a
group transfer or live synchronization. It is not encrypted; the UI warns users to protect the file.
No Google Drive connection or account is required. See [[import-export]] for selective group
sharing, which creates a new group with new IDs instead of restoring a device.
The app names new downloads `split-slate-backup-YYYY-MM-DD.zip`; renamed `.zip` files also work
because the contents, not the basename, identify a backup. The restore picker tells users what
filename to look for and keeps the replacement warning in the confirmation modal. A group-transfer
ZIP or CSV shows an **Import group** link, while an unrelated or damaged file shows a clear error
and the expected backup filename. Full-app backup is ZIP-only, not CSV. The download, picker, and
import guidance tell users not to modify the generated file: integrity checks reject changed data.

## Restore Boundary

The public `/restore` route is available before onboarding and from Settings. Before showing the
destructive action, it checks the archive's version, size, declared paths, SHA-256 dataset and
receipt digests, entity schema, cross-entity references, money/split validity, and onboarded local
identity. The dialog identifies the backup and shows counts. Its replace action is disabled for ten
seconds and explains that existing SplitSlate data will be permanently removed. Cancel changes
nothing.

After confirmation, a single Dexie transaction clears and replaces all nine app tables, retains
source IDs and relationships, and verifies collection counts before commit. A failure rolls back
both deletion and insertion. Only after commit does the app apply the saved theme and rehydrate
Zustand. This replaces SplitSlate storage for the site, not other websites' browser storage. There
is no merge or contact-name reconciliation during device restore.

## Limits

- Full backup requires a completed local identity and usable group references. After the last group
  is deleted, completed onboarding may have a `null` group reference and zero groups; that is still
  a valid backup. An incomplete or inconsistent dataset is rejected rather than silently producing
  a partial recovery file. See [[group-deletion]].
- Archive limits guard compressed and expanded sizes; an oversized dataset requires a future
  streaming format rather than a partial backup.
- Unsupported archive versions are rejected; future format revisions require an explicit restore
  migration rather than interpreting old backups as the current schema.
- Drive storage, scheduled backups, encryption, and cloud sync are outside this local workflow.

## Related

- [[import-export]] — selective Link/CSV/ZIP group transfer
- [[state-management]] — IndexedDB transaction and hydration boundary
- [[indexeddb-schema]] — the tables preserved by the backup
- [[product-roadmap]] — offline recovery before optional cloud features
