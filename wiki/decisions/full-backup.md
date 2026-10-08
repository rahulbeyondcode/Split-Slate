---
name: full-backup
description: One local ZIP for device-wide backup and destructive whole-app restore
metadata:
  type: decisions
---

# Decision: Whole-App Backup and Restore

Purpose: distinguish device recovery from selective, fresh-copy group transfers.

Last updated: 2026-10-09

## Scope

Settings downloads one versioned ZIP with every SplitSlate IndexedDB table: identity, global
people directory, groups, memberships, categories, tags, expenses, recorded group payments,
receipts (including blobs), settings, and activity snapshots. It also includes the app's saved
light/dark theme. The ZIP is a full local snapshot, not a
group transfer or live synchronization. It is not encrypted; the UI warns users to protect the file.
No Google Drive connection or account is required. See [[import-export]] for selective group
sharing, which creates a new group with new IDs instead of restoring a device.
The app names new downloads `split-slate-backup-YYYY-MM-DD.zip`; renamed `.zip` files also work
because the contents, not the basename, identify a backup. The restore picker tells users what
filename to look for and keeps the replacement warning in the confirmation modal. A group-transfer
ZIP or CSV shows an **Import group** link, while an unrelated or damaged file shows a clear error
and the expected backup filename. Full-app backup is ZIP-only, not CSV. The download, picker, and
import guidance tell users not to modify the generated file: integrity checks reject changed data.

## Entry-Page Presentation

Group import and whole-app restore share the same two-column entry layout: a branded story panel
on the left at tablet/desktop widths and a compact panel above the file chooser on mobile. The
decorative story icon is hidden on mobile so it does not stack below the SplitSlate brand; the
file chooser keeps its upload icon. Group import uses a muted teal gradient and app restore uses
slate blue at every viewport width. These public entry pages intentionally differ from the app's
purple branding; in-app and onboarding colors are unchanged. See [[import-export]] and [[onboarding]].

This is presentation only: restore retains its existing validation, replacement confirmation,
countdown, and transactional recovery behavior.

In Settings, Import group, Download app backup, and Restore app backup use matching neutral
action cards with regular-weight labels and short descriptions; no card has selected-state fill
or an accented label. Download retains its disabled, spinning Preparing state; Restore remains
a link to the public recovery page. The backup cards stack when available space is narrow and
use the app's existing light/dark theme tokens, not the entry-panel gradients.

## Restore Boundary

The public `/restore` route is available before onboarding and from Settings. Before showing the
destructive action, it checks the archive's version, size, declared paths, SHA-256 dataset and
receipt digests, entity schema, cross-entity references, money/split validity, and onboarded local
identity. The dialog identifies the backup and shows counts. Its replace action is disabled for ten
seconds and explains that existing SplitSlate data will be permanently removed. Cancel changes
nothing.

After confirmation, a single Dexie transaction clears and replaces all eleven app tables, retains
source IDs and relationships, and verifies collection counts before commit. A failure rolls back
both deletion and insertion. Only after commit does the app apply the saved theme and rehydrate
Zustand. This replaces SplitSlate storage for the site, not other websites' browser storage. There
is no merge or contact-name reconciliation during device restore.
Previously produced version 1 backups without activity snapshots remain restorable; replacing a
device with one of those backups leaves the activity table empty. Older backups without payment
rows also restore with an empty payment table. New backups include payment activity and history
even for deleted groups, whose name is retained in each event snapshot. See [[settlement-recording]].

## Limits

- Full backup requires a completed local identity and valid non-null group references. When the
  onboarding group is deleted, its reference may become `null`; that remains valid after creating
  or importing a replacement group. Backup and restore accept completed onboarding with a `null`
  group reference whether or not groups exist, but reject a non-null ID that refers to no group.
  An incomplete or inconsistent dataset is rejected rather than producing a partial recovery file.
  See [[group-deletion]] and [[onboarding-persistence]].
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
