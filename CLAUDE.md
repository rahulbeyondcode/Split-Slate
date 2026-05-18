# LLM Wiki — Operating Protocol

This project uses Andrej Karpathy's LLM Wiki pattern. The wiki is the primary compiled knowledge layer. Raw sources (code, spec, docs) are immutable evidence. Conversation history is ephemeral. The wiki is the only persistent memory.

---

# STRICT RULES — NO EXCEPTIONS

These are hard stops. Not guidelines. Not suggestions.

1. **Session start:** Read `wiki/index.md` before touching any code or answering any non-trivial question. No shortcuts.

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
│   └── pages/           ← one folder per page (e.g. groups-page/, onboarding-page/)
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
- Pages live in `app/pages/` only — never inside `features/`
- Non-shared hooks, store slices, types, and utils belong inside their `features/<feature>/` folder
- Shared UI components each get their own subfolder inside `shared/ui/`
- Never place a file at a level that skips this hierarchy (e.g. no loose files in `features/` root)
- No `api/` folders — this app is fully offline; use `store/` for all data operations

---

# Compression

Wiki pages are compiled cognition — not transcripts, not dumps.

- Summarize, abstract, synthesize
- One canonical page per concept — no synonym pages
- Expand existing pages before creating new ones
- Fewer high-quality pages beat many shallow ones
