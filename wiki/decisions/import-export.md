---
name: import-export
description: Data sharing design — three export formats, two import modes, conflict resolution strategy
metadata:
  type: decisions
---

# Decision: Import / Export Design

Last updated: 2026-05-18

## Why This Exists

owe-it is offline-first with no backend in MVP. Import/export is the only mechanism for sharing group data between devices. The core marketing promise: **members who don't have the app installed can view expense data with zero hassle.**

---

## Export Formats

### Link
- Group data is encoded as a hash fragment at the end of the URL (`#<encoded-data>`)
- Recipient clicks the link → web app opens → reads the hash → populates UI automatically
- No import step — zero hassle for the recipient
- **Size limitation:** Browser URL length limits vary across browsers. The app maintains an optimal data ceiling comfortable across most browsers. Groups whose data exceeds this ceiling are offered CSV/ZIP only — no link option is shown.

### CSV
- Full group data export (members, expenses, splits)
- No image attachments included
- Works for any group size
- Recipient shares via their own communication channel (WhatsApp, email, etc.)
- Recipient opens the app and imports the CSV manually

### ZIP
- CSV bundled with all receipt images from the group
- Offered when one or more expenses have image attachments
- The app auto-detects whether ZIP is needed — if no attachments exist, only CSV/Link are offered
- On import, app loads both data and images together

---

## Two Import Modes

### 1. View-Only (Zero Hassle)

- No owe-it account required
- **Link:** data auto-populates on open — nothing to do
- **CSV/ZIP:** user imports the file, data loads in read-only mode
- Can view: expense list, expense details, member balances
- Cannot add, edit, or delete anything
- **Storage:** Session storage only — data persists on tab reload, lost on tab close
- App warns the user before closing the tab that data will be lost
- To recover: click the link again, or re-import the CSV/ZIP

### 2. Import as Your Group (Editable)

For users who want to add or edit expenses after receiving shared data.

**Steps:**
1. User must have owe-it set up (name + icon configured)
2. Open the link or import the CSV/ZIP
3. Choose "Import as my group" from the view-only screen
4. Pick which member they are from the group's member list:
   - All existing members are listed (name + icon)
   - A **"New Member"** option is always available at the end — for someone not originally in the group
   - Selecting "New Member" uses the user's registered owe-it name, or prompts for a name if not yet set up
5. Group is added to their groups list

---

## Group Conflict Resolution

The exported data always includes the group's UUID. On import as your group:

| Scenario | Behaviour |
|----------|-----------|
| Same UUID already on device | Offer: Add new expenses only, or Replace completely |
| Different UUID, same group name | Offer: Replace existing group, or save as new group with `_1` appended (e.g. "Goa Trip_1") |
| Different UUID, different name | Add as new group — no conflict |

### When Same UUID Is Found (re-import of the same group)

- **Add new expenses only** — compares by `expenseId`; imports only expenses not already present. Safe, non-destructive. Any local additions are preserved.
- **Replace completely** — overwrites the entire group with the imported version. User is clearly warned that local additions will be lost before proceeding.

Full merge (tracking edits, deletions, conflict resolution) is deferred to V3 — it requires versioning and sync infrastructure that is out of scope for MVP.

---

## Receipt Attachments

- Attachments are optional on any expense
- No hard limit on the number of attachments per expense
- Images are compressed on ingest (resized to a max dimension of ~1920px) before being stored in IndexedDB — prevents silent device storage bloat
- Stored as blobs in a dedicated `attachments` IndexedDB table (separate from the expense record) — allows lazy loading; expenses load without pulling all image blobs
- ZIP export bundles all receipt images from all expenses in the group

---

## Related

- [[domain-models]] — Expense shape with `attachmentIds[]`
- [[indexeddb-schema]] — `attachments` table structure
- [[solo-group-support]] — solo groups can also be exported and imported
