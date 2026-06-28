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
- **PRs to `dev` = one stacked PR per "big step"** (epic/milestone). Pin each to a `release/<step>`
  branch so its scope stays stable while work continues on `dev-copilot`; base it on the previous
  release branch (or `dev` once that merged). Adam reviews/merges. Release: `dev → main`.
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
- **PR #5 `feat/discover-endpoint`** — DONE, merged. In-memory `SessionStore`, `POST /discover`,
  `scripts/test-discover.ts`. **Validated live (12 real candidates).** **Milestone `v0.1.0`.**
- **PR #6 `feat/frontend-skeleton`** — DONE, merged (`ad0fa22`). `@muse/frontend` (Vite 8 + React 19
  + Tailwind v4): app shell, typed API client, vite `/api` proxy, Vitest projects (node + jsdom), msw.
- **PR #7 `feat/chat-discover-ui`** — DONE, merged (`6750871`). `useCandidateStore` (zustand),
  `BriefForm` + `CandidateGrid`, App wired with role=status/alert.
- **PR #8 `feat/image-pipeline`** — DONE, merged (`5221925`). Backend `services/`: `fetchImage`
  (guards + timeout), aHash dedup (`averageHash`/`hammingDistance`/`dedupeByImageHash`), sharp
  `makeThumbnail` + disk `ThumbnailStore`, `GET /image/:id/thumbnail`. **Epic 2 complete.**
- **PR #9 `feat/proposition-contracts`** — DONE, merged. `@muse/shared`: `DiscoverInputSchema`
  (route refactored to it), `PropositionOptionSchema` + `PropositionRoundSchema`.
- **PR #10 `feat/proposition-engine`** — DONE, merged. `createPropositionEngine` (reuses Codex
  runner + parse, preview candidates from `previewUrl`, retry-once, cache by brief+refinements).
- **PR #11 `feat/propose-endpoint`** — DONE, merged. `POST /propose` → `PropositionRound`; registers
  preview candidates so `/image/:id/thumbnail` serves them; injectable engine in `buildServer`.
- **PR #12 `feat/proposition-ui`** — DONE, merged. Proposition store + grid + breadcrumb; App
  orchestrates brief → propose → pick (refine) → Search now → discover. **Epic 3 done.**
- **PR #13 `feat/canvas-contracts`** — DONE, merged. `@muse/shared`: `CanvasElementSchema` union,
  `BoardState`, `keptCandidateIds(board)` (curation gate).
- **PR #14 `feat/canvas-integration`** — DONE, merged (+ `fix/tldraw-dependency` PR #22). tldraw
  Whiteboard mounted (board adapter + store, grid, persistence). tldraw mocked in tests.
- **PR #15 `feat/candidate-tray-dragdrop`** — DONE, merged. `board/place.ts` (pure asset/shape
  builders), board store `addCandidate`/`removeCandidate`, `CandidateTray` beside the canvas
  (Add to board → kept tldraw image shape with `meta.candidateId`).
- **PR #16 `feat/annotations-shapes`** — DONE, merged. tldraw's toolbar already provides
  shape/arrow/draw/text tools; extended `mapTldrawShape` to capture text/arrow/freedraw into
  `BoardState` (board.json fidelity; board PNG is the visual source of truth).
- **PR #17 `feat/board-persistence`** — DONE, merged. Session store `getBoard`/`setBoard`
  (+`clear` nulls it); `GET /board` (stored or empty) + `POST /board` (zod-validated → 204 / 400);
  client `loadBoard`/`saveBoard`; board store `save()`; debounced autosave wired into the Whiteboard
  `onMount` (server save complements tldraw's local IndexedDB restore via `persistenceKey`).
  **Completes Epic 4 → milestone `v0.2.0`.**
- **PR #18 `feat/image-api-source`** — DONE, merged. Optional permissive image source:
  `services/image-source.ts` provider interface + keyless **Openverse** adapter (default) +
  **Unsplash** behind `UNSPLASH_ACCESS_KEY`, selected by `IMAGE_SOURCE`. `GET /images/search`
  → `ImageCandidate[]` (stored); 400/501/502. Frontend `searchImages` + msw handler.
- **PR #19 `feat/palette-extraction`** — DONE, merged. `services/palette.ts`: `extractPalette(buffers)`
  aggregates node-vibrant swatches → role-tagged hexes (dominant/accent/neutral/background).
  Determinism boundary (pixels only); golden-fixture tests.
- **PR #20 `feat/vlm-analysis`** — DONE, merged. `services/vlm.ts` (analyzer) +
  `services/vlm-providers.ts` (Anthropic default / OpenAI). One multi-image call → non-palette half
  of `MoodboardAnalysis`; defensive parse (`extractFirstJsonObject` + zod + retry), image-set cache.
  Config: `VLM_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `VLM_MODEL`.
- **PR #21 `feat/synthesize-endpoint`** — DONE, merged. `services/synthesize.ts` joins the two
  halves: resolve kept ids → fetch bytes → `extractPalette` + VLM analyze → merged
  `MoodboardAnalysis`. `POST /synthesize {imageIds}`; 400 / 501 / 502; synthesizer injectable.
- **PR #22 `feat/export-renderers`** — DONE, merged. `backend/src/render/`: pure renderers —
  `renderDesignTokens`/`renderManifest`/`renderDesignBrief`/`renderPrompt`. No IO/model calls.
  **Milestone `v0.3.0`**.
- **PR #23 `feat/export-bundle`** — DONE, merged. `services/export-bundle.ts`: `createExporter` zips
  (deterministic, in-memory via **fflate**) kept images + manifest/tokens/brief/prompt + board.json +
  optional client `board.png`. `POST /export {imageIds, analysis, boardPng?}` streams `application/zip`.
- **PR #24 `feat/export-panel-ui`** — DONE, merged. Frontend export panel: `synthesize`/
  `exportBundle` client, board-store `getBoardPng()`, export store, accessible `ExportPanel` in App.
- **PR #25 `chore/e2e-and-release`** — DONE (on branch, CI/merge pending). Playwright happy-path e2e
  (`frontend/e2e/`, `playwright.config.ts`, root `test:e2e`) against the built SPA with `/api`
  stubbed via `page.route` — fully hermetic; new **`e2e.yml`** workflow (installs Chromium). Also
  `release.yml` (tag → tarball + GitHub Release), `codex-contract.yml` (manual self-hosted live-Codex
  smoke, `verify:codex`), `docs/RUNBOOK.md`, README finalization. **Milestone `v1.0.0`.**
- **Roadmap COMPLETE (PRs #1–#25).** Big dev PR **#34** (`release/v1.0.0 → dev`) opened, CI+E2E green.
- **Post-v1.0.0 — `feat/agent-cli-adapter`** (on branch, CI/merge pending). Generalized the
  discovery/proposition seam to be engine-agnostic (`AgentRunner` = `CodexRunner`): added a **GitHub
  Copilot CLI** adapter (`adapters/agent-runner.ts`: `runCopilotExec` drives `copilot -p …
  --allow-all-tools --output-format json`, parses the terminal `assistant.message.data.content`),
  selected by `AGENT_CLI` (`codex` default | `copilot`). Added **CLI detection** (`services/
  cli-detect.ts`) surfaced on `GET /health` (`{ agent: { provider, bin, available, version } }`,
  cached 30s) + a startup warning. Both CLIs verified live (`/health`: codex 0.135.0, copilot 1.0.65).
  After merge: fast-forward `release/v1.0.0` to update PR #34.
- **CI note:** `ci.yml` stays the hermetic gate (lint/format/typecheck/test/build). `e2e.yml` is a
  separate Playwright job on the same triggers; both must be green before merging a feature branch.
- **`dev` integration:** `dev` has Epics 0–3 + Epic 4 canvas contracts (PRs #18, #20 merged).
  Whiteboard chunk (PR #14+) on `dev-copilot` awaits the next `dev` PR. (Per user: one big `dev` PR
  at the end of the run.)

## Environment (verified)

Codex CLI `0.135.0` · Node `26` · npm `11` · TypeScript `6.0.3` · @types/node `26` · ESLint `10` ·
typescript-eslint `8.62` · Prettier `3.9` · Vitest `4.1` · `gh 2.95.0` (authed `adam-riffi`,
scopes repo+workflow). Git identity: `Adam Riffi <211388619+adam-riffi@users.noreply.github.com>`.

## Decision log

- **2026-06-28** — Agent output parsing is **multi-array tolerant**: `extractAllJsonArrays` returns
  every balanced `[...]`, and discovery/proposition parsers pick the first that yields valid items
  (handles prose preambles, markdown-link brackets, ```json fences, `{"results":[…]}` wrappers, and
  bare-URL-string arrays). Fixes "Failed to parse … after one retry". `normalizeDiscoveryArray`
  accepts both `{url,…}` objects and bare URL strings.

- **2026-06-28** — Discovery streams progress over **SSE** (`GET /discover/stream`): each agent CLI's
  JSONL is normalized to an `AgentStreamEvent` union (`@muse/shared`) and relayed live so the UI shows
  reasoning + web searches. Runners gained line-buffered `onStdoutLine`; the frontend uses EventSource
  with a non-streaming fallback (jsdom/tests). The `failed` event name avoids EventSource's reserved
  `error`. Verified live (Codex emitted 11 real web-search frames before the result).

- **2026-06-28** — Agent CLI is pluggable behind `AgentRunner`: Codex (default) or GitHub Copilot
  CLI, via `AGENT_CLI`. Detection is exposed on `/health` (not a hard startup gate) so the app still
  boots without a CLI; discovery/propositions then fail clearly (502). VLM stays a separate seam.

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
- **2026-06-27** — Frontend: **Vite 8 + React 19 + Tailwind v4** (`@tailwindcss/vite`, no config
  file). `moduleResolution: bundler` (extensionless imports) vs NodeNext elsewhere. Vitest uses
  **projects** (one config) — `node` env for shared/backend, `jsdom` + React plugin for frontend —
  so `npm run test` stays a single command. msw (`msw/node`) mocks the backend in component/client
  tests. Frontend calls the backend through a vite `/api` proxy (`VITE_API_BASE`).
- **2026-06-27** — Frontend state: **zustand** (`useCandidateStore`). Components stay thin; the store
  owns the discovery call + status. Testing-library `cleanup()` is registered in `afterEach` (we use
  explicit vitest imports, not globals) to isolate renders.
- **2026-06-27** — **Dev-PR cadence (Adam's request, CORRECTED):** one scoped PR per big step,
  pinned to a `release/<step>` branch, with **base ALWAYS `dev`**. Do NOT base a dev PR on another
  release branch — that strands the work in the release branch instead of `dev` (the original
  #10/#12 did this; fixed via PR #13). Adam merges each into `dev`; the next is then scoped.
- **2026-06-27** — Image pipeline uses **sharp** (native; prebuilt binaries work in CI). aHash is
  computed on an 8x8 greyscale downscale (degenerate on flat colors — tests use structured images).
  Thumbnails are webp, cached on disk by candidate id. `createThumbnailStore` is sync (`mkdirSync`)
  so the sync `buildServer` can create it inline; the route fetches-on-demand and caches.

## Commands

```bash
npm ci
npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build
npx changeset            # add a changeset when behavior changes
```
