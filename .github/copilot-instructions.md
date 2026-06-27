# Muse — Copilot Working Context

> **This is the living context doc — the single source of project memory.** It is auto-loaded by
> GitHub Copilot and is updated as the **last commit of every PR**. Read it first; grow it as you go.

## What Muse is

An **agent-broker / orchestration layer** for moodboard creation (not just a moodboard app). The
engineering substance is reliably driving the locally installed **Codex CLI** and turning its
free-form output into structured, machine-consumable design intent.

**Flow:** Refine (style propositions) → Discover (Codex → `ImageCandidate[]`) → Curate (drag images
onto a tldraw whiteboard, annotate) → Synthesize (deterministic palette + one VLM pass) → Export
(portable zip bundle).

## Runtime constraint (load-bearing)

Local / self-hosted only. The backend spawns `codex` as a child process and needs a persistent Node
process with shell access. **Not** serverless/edge. Live Codex/VLM only run on the developer's
machine — **CI is always fully mocked, with no secrets.**

## Architecture (target)

npm-workspaces monorepo:

- `shared/` (`@muse/shared`) — **zod schemas = single source of truth** (`ImageCandidate`,
  `MoodboardAnalysis`, proposition, canvas/board, export). TS types are `z.infer`.
- `backend/` (`@muse/backend`) — Fastify. Owns `adapters/codex.ts` (the seam), image pipeline,
  propositions, palette, VLM, synthesis, export, board persistence.
- `frontend/` (`@muse/frontend`) — Vite + React + TS. Chat, proposition rounds, tldraw whiteboard,
  export panel.
- `scripts/` — standalone validation (e.g. `test-discover.ts`).

### Load-bearing contracts (implement first)

- `ImageCandidate { id, source, url, pageUrl?, title?, rationale }`, `id = sha256(url)`.
- `MoodboardAnalysis` — `palette` (deterministic, from pixels) + `typography/spacing/mood/motifs/
  summary` (single VLM pass). **Never fake the deterministic/inferred split.**
- Export bundle — `images/`, `manifest.json`, `design-tokens.json`, `design-brief.md`, `prompt.md`,
  plus whiteboard `board.json` + `board.png`. Renderers are **pure functions** (no model calls).

### Codex seam discipline

All version-sensitive logic lives in `backend/src/adapters/codex.ts`. Strip ANSI → extract first
**balanced** JSON array (bracket scan, not regex) → zod-validate → assign `id`/`source` → on failure
retry **once** with a stricter reminder, then fail gracefully preserving raw output. The same
discipline is reused for style propositions.

## Branch model & conventions

| Branch        | Purpose             | Who merges                     |
| ------------- | ------------------- | ------------------------------ |
| `main`        | Release             | Adam only (never touched by me) |
| `dev`         | Integration/review  | Adam only (accepts my PRs)     |
| `dev-copilot` | My dev mainline     | I merge when CI is green       |

- Feature branches cut from `dev-copilot`; PR back into it; merge on green CI.
- Milestone PRs: `dev-copilot → dev` (Adam reviews). Release: `dev → main`.
- **Never delete branches. Never touch `main`. Do not rename the repo or change its GitHub
  description** (README edits are fine).
- **Conventional Commits, atomic, no squash** on `dev-copilot` (preserve commit-by-commit history).
- **Definition of Done:** lint + format:check + typecheck + test + build green · Changeset if
  user-facing · update THIS doc as the last commit · CI stays mocked.

## Roadmap (see session plan.md for full PR-by-PR detail)

Epic 0 Foundation/CI → Epic 1 Seam (shared contracts → backend → codex adapter → /discover) →
Epic 2 Frontend base + image pipeline → Epic 3 Style propositions → Epic 4 tldraw whiteboard →
Epic 5 optional image API → Epic 6 Synthesis → Epic 7 Export + polish.
Milestones: `v0.1.0` seam · `v0.2.0` refine→discover→curate · `v0.3.0` synthesis · `v1.0.0` ship.

## Current state

- **PR #1 `chore/repo-foundation`** (this PR): npm-workspace root, TypeScript 6 base config,
  ESLint 10 flat config + Prettier, Vitest 4 + smoke test, CI workflow, Changesets, project docs,
  and this context doc. Full local gate is green.
- **Next:** open PR `chore/repo-foundation → dev-copilot`, merge on green CI, then **PR #2
  `feat/shared-contracts`** (zod contracts in `@muse/shared`).
- Before **PR #4** (codex adapter): run `codex --help` and pin the exact non-interactive invocation
  in `docs/CODEX.md`.

## Environment (verified)

Codex CLI `0.135.0` · Node `26` · npm `11` · TypeScript `6.0.3` · @types/node `26` · ESLint `10` ·
typescript-eslint `8.62` · Prettier `3.9` · Vitest `4.1` · `gh 2.95.0` (authed `adam-riffi`,
scopes repo+workflow). Git identity: `Adam Riffi <211388619+adam-riffi@users.noreply.github.com>`.

## Decision log

- **2026-06-27** — Three-branch model (`main`/`dev`/`dev-copilot`); I own `dev-copilot`, Adam owns
  `dev`/`main`. Branches are never deleted.
- **2026-06-27** — Canvas engine: **tldraw** (best moodboard UX). `BoardState` kept engine-agnostic
  (zod) behind an adapter so Excalidraw/react-konva remain reversible fallbacks.
- **2026-06-27** — Living context doc lives at `.github/copilot-instructions.md` (auto-loaded by
  Copilot); no `AGENTS.md`.
- **2026-06-27** — Added two product features beyond the brief: iterative **style propositions** (a
  second agentic seam) and a **whiteboard** curation surface (supersedes simple keep/reject grid).
- **2026-06-27** — CI is fully mocked; live Codex/VLM verification is local-only. Public repo →
  no secrets in CI.
- **2026-06-27** — Changesets toolchain has 13 moderate **dev-only** transitive audit notices; not
  fixable without a breaking bump, so deferred.

## Commands

```bash
npm ci
npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build
npx changeset            # add a changeset when behavior changes
```
