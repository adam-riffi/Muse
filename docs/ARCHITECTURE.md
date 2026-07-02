# Architecture (stub)

> This is a living stub, expanded as the system is built. The authoritative, continuously updated
> project context lives in [`.github/copilot-instructions.md`](../.github/copilot-instructions.md).

Muse is an **agent-broker / orchestration layer**, not just a moodboard app. The engineering
substance is reliably driving an external agentic CLI (Codex) and turning its free-form output into
structured, machine-consumable design intent.

## Flow

1. **Refine** — propose distinct sub-styles from a brief (one preview image each); the user narrows.
2. **Discover** — sharpened brief → Codex CLI → normalized `ImageCandidate[]`.
3. **Curate** — drag references onto an infinite grid whiteboard; annotate with shapes/arrows/text.
4. **Synthesize** — deterministic palette (pixels) + a single VLM pass → export bundle (zip).

## Monorepo layout (npm workspaces)

```
shared/    @muse/shared    — zod schemas = single source of truth (contracts)
backend/   @muse/backend   — Fastify; owns Codex adapter, image pipeline, synthesis, export
frontend/  @muse/frontend  — Vite + React + TS; chat, propositions, whiteboard, export panel
scripts/                   — standalone validation (e.g. test-discover.ts)
```

## Load-bearing contracts (implemented first)

- `ImageCandidate` — `{ id, source, url, pageUrl?, title?, rationale }` (`id = hash(url)`).
- `MoodboardAnalysis` — palette (deterministic) + typography/spacing/mood/motifs/summary (VLM).
- Export bundle — `images/`, `manifest.json`, `design-tokens.json`, `design-brief.md`, `prompt.md`,
  plus the whiteboard snapshot (`board.json` + `board.png`).

## Frontend ↔ backend boundary (kept clean for future UI refactors)

The two sides cross only through **typed contracts** and a **single network seam**, so the UI can be
refactored (or replaced) without touching business logic.

```
@muse/shared (zod)  ─ the only types that cross the wire
        │
frontend/src/
  api/config.ts   ─ API_BASE (one place)
  api/client.ts   ─ THE network boundary: every fetch/EventSource lives here, nowhere else
  api/urls.ts     ─ pure URL builders (no network), safe for the UI to use
  state/*         ─ stores (zustand): call the client, hold state, expose actions/selectors
  components/*    ─ presentational: read state + props only; never call the API
  board/*  lib/*  ─ pure domain/util helpers
```

Layering rules (enforced by ESLint — see `eslint.config.js`):

- **Frontend never imports backend code** — only `@muse/shared` + the API client cross the boundary.
- **Network lives only in `api/client.ts`** (no stray `fetch`/`EventSource` in stores or components).
- **Components never import `api/client`** — they go through a store; pure URL builders (`api/urls`)
  are the one exception they may import.

A new/redesigned UI only needs the `state/*` actions+selectors and `@muse/shared` types; the
`api/*` and backend layers are untouched.

## Key principles

- **Isolate CLI fragility.** Every Codex-specific, version-sensitive detail lives in
  `backend/src/adapters/codex.ts`; the rest of the app only sees normalized `ImageCandidate[]`.
- **Deterministic/inferred split is sacred.** Palette comes from pixels; typography, spacing, mood,
  and motifs come from the single VLM pass. Renderers are pure functions — no extra model calls.
- **Defensive parsing.** Structured-output discipline (JSON only) + balanced-bracket scan + zod
  validation + one strict-reminder retry.

## Stack

Vite + React + TypeScript · Fastify + TypeScript · Node `child_process` → Codex CLI · `sharp` +
`node-vibrant` (palette/dedup) · a VLM provider SDK · `archiver` (zip) · `tldraw` (whiteboard).
