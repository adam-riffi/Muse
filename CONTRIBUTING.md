# Contributing to Muse

Muse is an **agent-broker / orchestration layer** for moodboard creation: it drives the locally
installed **Codex CLI** to discover image references, lets you curate them on a whiteboard, and
synthesizes a portable design-intent bundle. This document describes how we work in this repo.

## Runtime constraint

Muse is **local / self-hosted**. The backend spawns the `codex` child process and (optionally)
calls a vision model, so it requires a persistent Node process with shell access and an
authenticated Codex CLI. It is **not** designed for serverless/edge runtimes.

## Prerequisites

- **Node 26** (see `.nvmrc`) and **npm 11+**
- **Codex CLI** installed and authenticated (for live discovery; not needed for tests)

```bash
npm ci
```

## Branch model

Three long-lived branches:

| Branch        | Purpose                          | Who merges                         |
| ------------- | -------------------------------- | ---------------------------------- |
| `main`        | Release branch                   | Adam only (via `dev → main`)       |
| `dev`         | Integration / review             | Adam only (accepts PRs into `dev`) |
| `dev-copilot` | Active development mainline      | Merged when CI is green            |

- Feature branches (`feat/…`, `fix/…`, `chore/…`, `ci/…`, `docs/…`) are cut from **`dev-copilot`**
  and merged back into it once CI passes.
- At each milestone, `dev-copilot` is proposed into **`dev`** via PR for review.
- `dev → main` is the release promotion.
- **Branches are never deleted**, even after merge.

## Commits

- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `test:`, `refactor:` …).
- **Atomic**: one coherent change per commit.
- History on `dev-copilot` is preserved commit-by-commit (no squash) so the build narrative is legible.

## Definition of Done (every PR)

- `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, `npm run build` all pass.
- A Changeset is added (`npx changeset`) when user-facing behavior changes.
- The living context doc (`.github/copilot-instructions.md`) is updated as the **last commit**.
- CI stays **fully mocked** — no live Codex/VLM calls and no secrets in CI.

## Local commands

```bash
npm run lint          # eslint
npm run format        # prettier --write
npm run format:check  # prettier --check
npm run typecheck     # tsc --noEmit
npm run test          # vitest run
npm run build         # workspace builds
```

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the monorepo structure and the load-bearing
contracts. The single source of project memory is [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
