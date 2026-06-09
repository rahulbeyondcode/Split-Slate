# LLM Wiki — Operating Protocol

This project uses Andrej Karpathy's LLM Wiki pattern. The wiki is the primary compiled knowledge layer. Raw sources (code, spec, docs) are immutable evidence. Conversation history is ephemeral. The wiki is the only persistent memory.

---

# STRICT RULES — NO EXCEPTIONS

These are hard stops. Not guidelines. Not suggestions.

1. **Session start:** Read `wiki/index.md` before touching any code or answering any non-trivial question. No shortcuts.

2. **Plan before code — mandatory:** Before writing any code, list every file you will create or modify. Each entry is the file path followed by a description of max 3 lines. Wait for explicit user approval before writing any code.

2. **Wiki proposals are mandatory:** If you identify something worth adding or changing in the wiki, you MUST explicitly propose it to the user and wait for approval or rejection before writing anything. You cannot defer it. You cannot add it silently. You cannot let it get lost in the noise of a long conversation.

3. **Index integrity is absolute:** You are NEVER allowed to create, modify, or delete a wiki page without updating `wiki/index.md` in the same action. No exceptions under any circumstances.

4. **Wiki is the only memory:** Do not use the per-project auto-memory system (`~/.claude/projects/.../memory/`). Do not write there. The wiki is the single source of persistent memory for this project.

5. **Source reality always wins:** If a wiki page contradicts the code, the code is correct. Update the wiki immediately. Never reason from the wiki against observable reality.

---

# Three Core Operations

## Ingest
When durable knowledge is discovered (a decision was made, architecture changed, a non-obvious invariant was found):
1. Propose the wiki page or update explicitly to the user — state what page, what content, why it matters
2. Wait for approval or rejection
3. On approval: write the page, update `wiki/index.md`, append to `wiki/log.md`

## Query
When answering questions or navigating the codebase:
1. Read `wiki/index.md`
2. Traverse relevant pages
3. Only inspect raw source if the wiki doesn't answer it
4. If the query surfaces new durable knowledge → trigger Ingest

## Lint
When triggered by the user (every few weeks):
1. Check every wiki page against current source code
2. Flag: contradictions, stale claims, orphan pages, duplicates
3. Propose all removals and updates for approval — do not act unilaterally
4. Update `wiki/index.md` and `wiki/log.md` after approved changes

---

# Wiki Structure

```
wiki/
  index.md        ← mandatory navigation hub, always current
  log.md          ← chronological record of all wiki changes
  architecture/   ← system design, data models, algorithms
  decisions/      ← why, not what (rejected alternatives, constraints)
  systems/        ← schemas, infrastructure, external integrations
  debugging/      ← non-obvious bugs and root causes
  learnings/      ← patterns and invariants discovered in code
  workflows/      ← step-by-step flows for complex operations
  glossary/       ← domain terms with precise definitions
```

---

# Page Requirements

Every wiki page must have:
- Clear title
- One-line purpose statement
- Factual content only
- Links to related pages using `[[page-name]]`
- Last-updated date

---

# What Belongs in the Wiki

**Write:**
- Architectural decisions and rejected alternatives
- Non-obvious invariants
- Algorithm explanations with worked examples
- Schema and data model designs
- Debugging discoveries likely to recur
- Scope and naming decisions with rationale

**Never write:**
- Raw logs, stack traces, or conversation transcripts
- Temporary thoughts or in-progress speculation
- Anything derivable from reading the code in under 30 seconds
- Anything the user has not approved

---

# index.md Rules

`wiki/index.md` must:
- Link to every page in the wiki with a one-line description
- Reflect current implementation status
- Be updated in the same action as any page creation, rename, or deletion
- Remain traversable by reasoning alone — no dead links, no missing pages

---

# log.md Format

```
## YYYY-MM-DD
- CREATED [path] — reason
- UPDATED [path] — reason
- REMOVED [path] — reason
```

Example:
```
## 2026-05-17
- CREATED architecture/balance-calculation.md — document net balance algorithm before implementation
- UPDATED wiki/index.md — added balance-calculation entry
```

---

# Knowledge Hierarchy

When sources conflict, this order decides:

1. Raw source code
2. Official spec (`spec-sheet.md`)
3. Tests and runtime behavior
4. Wiki pages

The wiki reflects reality. It does not define it.

---

# Source Folder Structure — STRICT, NO EXCEPTIONS

All file and folder names must be **kebab-case**. No exceptions.

```
src/
├── app/
│   ├── router/          ← route definitions
│   ├── providers/       ← React context providers
│   └── layouts/         ← structural layout wrappers (e.g. app-shell/)
│
├── assets/
│   ├── images/
│   ├── fonts/
│   └── svgs/
│
├── shared/              ← anything used by 2+ features
│   ├── ui/              ← each component in its own folder: button/button.tsx + button.types.ts
│   ├── hooks/           ← shared custom hooks
│   ├── utils/           ← shared utility functions
│   ├── configs/         ← store config, logger, etc.
│   └── constants/
│
├── features/            ← one folder per domain feature
│   └── <feature>/
│       ├── components/  ← each component in its own folder with index.tsx
│       ├── hooks/       ← hooks used only by this feature
│       ├── store/       ← index.ts + helper-functions.ts (only if helpers needed)
│       ├── types/       ← <feature>.types.ts
│       └── utils/       ← feature-local utilities (if needed)
│
├── App.tsx
├── main.tsx
└── index.css
```

**Rules:**
- Non-shared hooks, store slices, types, and utils belong inside their `features/<feature>/` folder
- Shared UI components each get their own subfolder inside `shared/ui/`
- Never place a file at a level that skips this hierarchy (e.g. no loose files in `features/` root)
- No `api/` folders — this app is fully offline; use `store/` for all data operations
- No `pages/` folder — routes in `app/router/` reference feature components directly; never create thin page wrappers

---

# Code Style — STRICT, NO EXCEPTIONS

Formatting is enforced by Prettier (`.prettierrc.json`) and ESLint (`eslint.config.js`).
Run `pnpm format` to fix formatting and `pnpm lint:fix` to auto-fix lint issues.
The rules below are the canonical statement of intent; the tooling is how it's enforced.

## Formatting (Prettier-enforced)
- **Semicolons:** required.
- **Strings:** double quotes (`"INR"`), single allowed only to avoid escaping. JSX attributes use double quotes.
- **Indentation:** 2 spaces.
- **Trailing commas:** on every multiline list/object/param set.
- **Arrow params:** always parenthesised — `(d) => ...`, not `d => ...`.
- **Line width:** 100 columns.

## Imports
- **Always use the `@/` alias** for cross-folder imports — never relative parent paths (`../`). Sibling `./` imports are fine. (ESLint-enforced.)
- **Type-only imports use `import type`** — `import type { Group } from "@/shared/types/domain.types"`. (ESLint-enforced, auto-fixable.)
- **Import order is grouped and alphabetised** (ESLint-enforced via `simple-import-sort`, auto-fixable with `pnpm lint:fix`). Groups appear in this order, each separated by **one blank line**, each sorted alphabetically within:
  1. **Packages** — node builtins and external modules (`react`, `react-router-dom`, `zustand`, …)
  2. **Components** — `@/` paths under a `components/` directory
  3. **Store / logic** — `@/` store, configs, hooks, utils, helpers
  4. **Types & constants** — `@/` `types`/`constants` (including type files colocated under `components/`)

  ```ts
  import { useState } from "react";
  import { useNavigate } from "react-router-dom";

  import StepIdentity from "@/features/onboarding/components/setup-flow/step-identity";
  import PortalContainer from "@/shared/components/portal/portal-container";

  import { useStore } from "@/shared/configs/store";

  import type { SetupData } from "@/features/onboarding/components/setup-flow/types";
  import { PERSON_EMOJIS } from "@/shared/constants/emojis";
  ```

## Components
- One component per folder as `index.tsx`. Arrow-function components: `const Foo = (props) => { ... }`.
- **Components use `export default`** at the bottom of the file. Everything else (stores, hooks, utils, types, constants) uses **named exports**.
- **Props are typed with a local `interface PropsType`** declared above the component.
- **No inline multi-statement callbacks in JSX.** Extract any handler with a body into a named `handleX` function above the `return`; pass it by reference (`onToggle={handleToggleCategory}`). Trivial one-expression callbacks (`onNext={() => setStep("next")}`) may stay inline.

## Types
- Domain/data shapes are `interface` (see `shared/types/domain.types.ts`). Use `type` for unions, aliases, and form-value shapes (`type FormValues = z.infer<typeof schema>`).
- Constants are `SCREAMING_SNAKE_CASE` (`PERSON_EMOJIS`, `MASTER_CATEGORIES`).

## Forms
- All forms use **react-hook-form + Zod** via `zodResolver`, wrapped in `FormProvider`, with the shared `Input` / `EmojiPicker` field components. Do not hand-roll controlled inputs or ad-hoc validation.

## Store (Zustand)
- Mutations are `async` thunks: write to Dexie (`db`) first, then optimistically update state via `set(...)`, then return the created/updated entity.
- IDs are generated with `uuid()`. Never derive IDs from user input.

---

# Compression

Wiki pages are compiled cognition — not transcripts, not dumps.

- Summarize, abstract, synthesize
- One canonical page per concept — no synonym pages
- Expand existing pages before creating new ones
- Fewer high-quality pages beat many shallow ones
