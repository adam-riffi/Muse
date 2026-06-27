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

- **PR #1 `chore/repo-foundation`** — DONE, merged into `dev-copilot` (`0ed4244`). Monorepo root,
  TS 6 base config, ESLint 10 + Prettier, Vitest 4, CI workflow, Changesets, project docs, this doc.
- **PR #2 `feat/shared-contracts`** — DONE, merged (`4f982c1`). `@muse/shared` (zod 4): `imageId`
  sha256 (subpath `@muse/shared/hash`), `ImageCandidate`, `MoodboardAnalysis` (+ sub-schemas), export
  bundle schemas (`Manifest`, `DesignTokens`).
- **PR #3 `feat/backend-skeleton`** — DONE, merged (`05327ed`). `@muse/backend` (Fastify 5, tsx):
  `loadConfig`, `buildServer(config)` (logger + JSON 404 + typed error handler), `GET /health`,
  entrypoint with graceful shutdown.
- **PR #4 `feat/codex-adapter`** — DONE, merged (`64374e3`). THE seam, isolated in
  `backend/src/adapters/`: `parse.ts`, `codex-prompt.ts`, `normalize.ts`, `codex-runner.ts`,
  `codex.ts` (`discoverImages`: retry-once → `CodexDiscoveryError`). Pinned in `docs/CODEX.md`.
- **PR #5 `feat/discover-endpoint`** — DONE (on branch, CI/merge pending). In-memory `SessionStore`,
  `POST /discover` (zod body → `ImageCandidate[]`, 400/502 handling, injectable adapter + store),
  `scripts/test-discover.ts`. **Validated live: a brief returned 12 real candidates via Codex web
  search.** 73 tests. **Milestone `v0.1.0`** (changeset added).
- **Next:** **PR #6 `feat/frontend-skeleton`** — Vite + React + TS app shell, typed API client over
  `@muse/shared`, Tailwind, testing-library + msw. (Starts Epic 2; adds the `frontend` workspace.)
- **Integration to `dev`:** GitHub PR #5 (`dev-copilot → dev`) is open for Adam to review/merge
  (note: GitHub PR numbers now differ from roadmap PR numbers).

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
- **2026-06-27** — `@muse/shared` uses **zod 4** (`z.url()`, `z.iso.datetime()`). Schemas are the
  single source of truth; TS types are `z.infer`. The `imageId` (node:crypto sha256) util lives
  behind the `@muse/shared/hash` subpath so browser consumers never bundle Node built-ins. Each
  workspace uses split tsconfigs: `tsconfig.json` (typecheck, includes tests) + `tsconfig.build.json`
  (emit src-only to `dist` with declarations).
- **2026-06-27** — Monorepo resolution: consumers import the **built** `@muse/shared` (dist via
  package `exports`). Root `typecheck`/`test` run `build:shared` first so dist is resolvable; no path
  aliases. Backend: Fastify 5, `tsx` for dev/watch, `node dist/index.js` for start. `setErrorHandler`
  is typed with the explicit `<FastifyError>` generic (Fastify v5 defaults `TError` to `unknown`).
- **2026-06-27** — Codex seam (verified `codex-cli 0.135.0`): invoke `codex exec --json --color never
  --skip-git-repo-check --ephemeral -o <tmp> <prompt>`, stdin ignored. Parse the last-message file
  (fallback: last `agent_message` in JSONL) → stripAnsi → balanced-bracket array → zod. Retry once,
  then `CodexDiscoveryError` with raw output. The adapter is injected a `CodexRunner` so tests are
  hermetic (no real spawn); the live invocation is exercised by `scripts/test-discover.ts` in PR #5.
  Full surface pinned in `docs/CODEX.md`.

## Commands

```bash
npm ci
npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build
npx changeset            # add a changeset when behavior changes
```
