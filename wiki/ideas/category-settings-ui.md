---
name: category-settings-ui
description: TODO — settings UI to let users configure category defaults for group creation
metadata:
  type: ideas
---

# Category Settings UI

Last updated: 2026-06-10

**Status: data layer built; settings UI still TODO**

The data layer now exists as the `"categories"` row in the shared `settings` store (see [[indexeddb-schema]]):

- `master` — the full master category list as `{ name, icon }[]` (was a hardcoded constant, now DB-backed so it can become user-editable)
- `default` — names (subset of `master`) pre-selected when creating a group

Both are seeded from code constants on first launch (`SEED_MASTER_CATEGORIES`, `SEED_DEFAULT_GROUP_CATEGORIES`) and DB-authoritative thereafter. Zustand exposes them as `masterCategories` / `defaultGroupCategories`.

**Still TODO:**
- A settings screen to edit the `master` and `default` lists (add/remove/rename master categories; toggle which are pre-selected).
- A store action to persist edits back to the `"categories"` row (no `updateCategorySettings` thunk yet — only seed-on-init and reads exist).
- Open refinement: the original idea split "visible in picker" from "pre-checked". The current shape collapses to `master` (all) + `default` (pre-checked); a separate visible-subset can be added later if needed.

## Related

- [[category-management]] — how these defaults are applied at group creation
- [[indexeddb-schema]] — the `settings` store (`"categories"` row)
