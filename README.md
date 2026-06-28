<div align="center">

# 🎨 Muse

### Turn ideas, references, and vibes into a cohesive, portable visual direction.

Muse is an **agent-broker** that drives your local **Codex** or **GitHub Copilot** CLI to discover
image references from a natural-language brief, lets you curate them on a draw.io-style
**whiteboard**, and synthesizes a portable **design-intent bundle** you can hand to any design agent.

<br/>

[![Version](https://img.shields.io/badge/version-1.0.0-0A7EA4?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-3DA639?style=flat-square)](#license)
[![CI](https://github.com/adam-riffi/Muse/actions/workflows/ci.yml/badge.svg?branch=dev-copilot)](https://github.com/adam-riffi/Muse/actions/workflows/ci.yml)
[![E2E](https://github.com/adam-riffi/Muse/actions/workflows/e2e.yml/badge.svg?branch=dev-copilot)](https://github.com/adam-riffi/Muse/actions/workflows/e2e.yml)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_26-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)
![tldraw](https://img.shields.io/badge/tldraw-1A1A1A?style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)

**[Architecture](docs/ARCHITECTURE.md) · [Agent CLI](docs/CODEX.md) · [Runbook](docs/RUNBOOK.md) · [Contributing](CONTRIBUTING.md)**

</div>

---

> **Status: `v1.0.0`** — the full pipeline works end to end: refine → discover → curate on a
> whiteboard → synthesize → export a portable bundle.

## ✨ Features

- 🧭 **Style propositions** — turn a vague brief into concrete sub-styles (e.g. anime → Ghibli / Y2K / retro), each with a preview, to pin down what you actually want.
- 🔎 **Agent discovery** — your local Codex/Copilot CLI web-searches for real image references; results are normalized, de-duplicated, and thumbnailed.
- 🖼️ **Whiteboard curation** — a draw.io-style grid canvas (tldraw): drag references in, annotate with shapes / arrows / text; the board autosaves.
- 🎨 **Synthesis** — a deterministic palette (from pixels) plus a single vision-model pass for typography, spacing, mood, and motifs.
- 📦 **Portable export** — one click downloads a zip: images + `manifest.json` + `design-tokens.json` + `design-brief.md` + agent-ready `prompt.md` + `board.json` + `board.png`.
- 🔌 **Pluggable agent CLI** — Codex (default) or GitHub Copilot, auto-detected and reported on `GET /health`.

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
| `GET /discover/stream` | same discovery as **SSE** — live `activity` events (reasoning / web searches) then a `result` event |
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
