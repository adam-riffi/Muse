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
