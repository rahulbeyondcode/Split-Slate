# Development Tools

Purpose: describe realistic development presets, individual creation actions, and their persistence boundaries.

Last updated: 2026-09-19

## Presets and naming

`src/features/dev-tools/utils/random-data.ts` owns 20 presets each for people, groups, categories,
tags, and expenses. `getRandomDevData(type, existingNames?)` returns a fresh, typed template;
`member` shares the person pool because membership links a person to a group rather than owning
another identity. Templates contain display fields, not persisted IDs or foreign keys.

Given existing names, selection randomly chooses an unused base name first. Once every base name
is occupied, it randomly chooses a preset and adds the first free suffix starting at 2. Name
comparisons trim whitespace and ignore case. Creation actions supply directory-wide names for
people/groups and group-scoped names for categories/tags, including inactive categories. Expense
titles can repeat, as real recurring purchases do.

New group presets use INR. Expense amounts are nominal whole major units interpreted in the
target group's currency, with no exchange conversion. These are development examples, not prices
calibrated for every currency.

## Individual creation

The panel is rendered only when `import.meta.env.DEV` is true. Complete onboarding before using
its individual creation buttons. Select the target group explicitly; it initially defaults to the
first available group and switches to a newly created group after successful creation.

- **Person:** creates a directory entry with a realistic name and icon.
- **Group:** creates a group with the local user as its member, then adds a random starter category.
- **Member:** randomly links an existing person who is not already in the selected group. If none
  are available, creates a person first and then adds their membership.
- **Category / tag:** adds a named preset to the selected group using collision-free naming.
- **Expense:** selects a coherent title, amount, and category; reuses the matching active category
  or an active numbered variant, otherwise creates one. A random valid member pays; all valid
  group members share equally. The local user must be a valid member. Dates fall within the last
  30 days; generated expenses have no tags or attachments.

Creation runs through existing store actions, preserving UUID generation, expense validation,
minor-unit accounting, and payer ranking. Successful additions update the store without a reload.
The panel disables actions while a write is pending and uses a synchronous guard against repeated
clicks. Receipt attachments and settings do not have individual generation actions.

## Persistence and resets

Composed additions are sequential, matching existing store boundaries. A category failure after
group creation leaves the group; a membership failure after person creation leaves the person;
an expense failure after category creation leaves the category. Those later-step errors explain
which record remains available. Underlying store transaction limits still apply; see
[[state-management]].

The existing **Onboard user** action replaces the database with its fixed onboarding fixture in
one transaction. **Clear database** deletes the database. Both reload the app after success and
remain distinct from individual creation. They do not use the random preset pools. Onboarding
fixture category IDs, like other generated IDs, use UUIDs.

## Related

- [[domain-models]] — entity ownership and relationships
- [[state-management]] — validation and persistence boundaries
- [[money-representation-and-rounding]] — currency precision and allocation
- [[onboarding]] — identity, membership, and onboarding completion
