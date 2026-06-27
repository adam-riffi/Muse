# Runbook

Operating guide for running Muse end to end and for the CI/CD workflows.

## Local: full app

1. **Prereqs:** Node 26 (`.nvmrc`), npm 11+, and — for live discovery — an authenticated Codex CLI
   (`codex login status` → "Logged in").
2. **Install & build shared:** `npm ci && npm run build`.
3. **Backend:** `npm run -w @muse/backend dev` (http://127.0.0.1:3001).
4. **Frontend:** `npm run -w @muse/frontend dev` (http://localhost:5173, proxies `/api`).
5. Walk the flow in the UI: brief → propose → pick → **Search now** → curate on the whiteboard →
   **Export bundle**.

### Environment

Set in `backend/.env` (never commit secrets):

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | backend port |
| `IMAGE_SOURCE` | `openverse` | `none` \| `openverse` (keyless) \| `unsplash` |
| `UNSPLASH_ACCESS_KEY` | — | required when `IMAGE_SOURCE=unsplash` |
| `VLM_PROVIDER` | `anthropic` | `none` \| `anthropic` \| `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | — | required for synthesis (`/synthesize`, `/export`) |
| `VLM_MODEL` | provider default | override the model |

With `VLM_PROVIDER=none` (or no key), `/synthesize` returns **501** — discovery and curation still work.

## CI/CD

- **`ci.yml`** — every PR into `dev-copilot`/`dev`/`main` and every push to `dev-copilot`:
  `npm ci` → lint → format:check → typecheck → test → build. Hermetic: Codex and the VLM are mocked
  with fixtures; no network, no secrets.
- **`e2e.yml`** — same triggers: installs the Playwright Chromium browser and runs the happy-path
  spec against the built SPA with all `/api` calls stubbed (no backend/Codex/VLM).
- **`release.yml`** — on a `v*` tag: builds all workspaces, assembles an install tarball
  (`shared/dist` + `backend/dist` + `frontend/dist` + manifests + docs), and publishes a GitHub
  Release with generated notes.
- **`codex-contract.yml`** — manual (`workflow_dispatch`), **self-hosted only**: runs a real Codex
  discovery (`npm run verify:codex`) to catch CLI version drift. Never runs automatically.

### Cutting a release

1. Land changes on `dev-copilot` (CI + E2E green), open the `dev` PR, merge to `main`.
2. `npx changeset version` to bump versions and update changelogs; commit.
3. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z` → `release.yml` publishes the GitHub Release.

## Verifying the Codex seam by hand

```bash
npm run verify:codex -- "minimal brutalist portfolio, concrete textures, monospaced type"
```

Invokes the real Codex CLI and prints the normalized `ImageCandidate[]` — the seam the app is built on.
