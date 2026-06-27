# Muse
AI-powered moodboard generator for turning ideas, references, and vibes into cohesive visual direction.

Muse is an **agent-broker / orchestration layer**: it drives the locally installed **Codex CLI** to
discover image references from a natural-language brief, lets you curate them on a whiteboard, and
synthesizes a portable design-intent bundle you can hand to a design agent.

> Status: **v1.0.0** — the full pipeline works end to end: refine → discover → curate on a
> whiteboard → synthesize → export a portable bundle.
> Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Codex integration: [docs/CODEX.md](docs/CODEX.md) · Operating guide: [docs/RUNBOOK.md](docs/RUNBOOK.md) · Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

## Runtime constraint

Muse is **local / self-hosted**. The backend spawns the `codex` child process, so it needs a
persistent Node process with shell access and an authenticated Codex CLI. It is **not** designed for
serverless/edge.

## Prerequisites

- **Node 26** (see `.nvmrc`) and **npm 11+**
- **Codex CLI** installed and authenticated (`codex login status` → "Logged in") — for live discovery

## Setup

```bash
npm ci
npm run build        # builds @muse/shared (consumed by the backend)
```

## Try the discovery seam

Run one real discovery from the terminal and print the parsed `ImageCandidate[]`:

```bash
npm run -w @muse/backend discover -- "minimal brutalist portfolio site, concrete textures, monospaced type"
```

This invokes the real Codex CLI (web search) and prints normalized candidates — the validated seam
the rest of the app is built on.

## Run the backend

```bash
npm run -w @muse/backend dev      # tsx watch (http://127.0.0.1:3001)
# or, after a build:
npm run -w @muse/backend start
```

HTTP API:

| Method & path | Purpose |
| --- | --- |
| `GET /health` | liveness + detected agent CLI (`{ agent: { provider, bin, available, version } }`) |
| `POST /propose` | style propositions (`{ brief, refinements?, n? }` → `PropositionRound`) |
| `POST /discover` | discovery (`{ brief, count?, refinements? }` → `ImageCandidate[]`) |
| `GET /image/:id/thumbnail` | cached thumbnail for a candidate |
| `GET /images/search` | optional image-source search (`?q=&n=`, Openverse/Unsplash) |
| `GET` / `POST /board` | load / save the whiteboard `BoardState` |
| `POST /synthesize` | `{ imageIds }` → `MoodboardAnalysis` (palette + VLM) |
| `POST /export` | `{ imageIds, analysis, boardPng? }` → streamed zip bundle |

Configuration is read from the backend env (see `backend/.env.example`): `AGENT_CLI`
(`codex` default, or `copilot`), `CODEX_BIN`/`COPILOT_BIN`, `IMAGE_SOURCE`, `UNSPLASH_ACCESS_KEY`,
`VLM_PROVIDER`, `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`, `VLM_MODEL`, `PORT`. `GET /health` reports
which agent CLI was detected (provider + version), so you can confirm the backend can drive your
Codex or GitHub Copilot CLI.

## Run the frontend

```bash
npm run -w @muse/frontend dev     # Vite (http://localhost:5173), proxies /api to the backend
```

The UI walks the full flow: enter a brief → pick a sub-style → **Search now** → drag references onto
the **whiteboard** (grid canvas with shapes/arrows/text) → **Export bundle** (downloads a zip with the
images, `manifest.json`, `design-tokens.json`, `design-brief.md`, `prompt.md`, `board.json`, and the
rasterized `board.png`).

## Development

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build
npm run test:e2e   # Playwright happy path (hermetic: /api is stubbed, no backend/Codex/VLM)
```

## License

MIT
