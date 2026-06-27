# Muse
AI-powered moodboard generator for turning ideas, references, and vibes into cohesive visual direction.

Muse is an **agent-broker / orchestration layer**: it drives the locally installed **Codex CLI** to
discover image references from a natural-language brief, lets you curate them on a whiteboard, and
synthesizes a portable design-intent bundle you can hand to a design agent.

> Status: building toward v1.0.0. **v0.1.0 — the Codex discovery seam — is working** (see below).
> Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Codex integration: [docs/CODEX.md](docs/CODEX.md) · Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

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

Endpoints: `GET /health`, `POST /discover` (`{ brief, count?, refinements? }` → `ImageCandidate[]`).
Configuration is read from the backend env (see `backend/.env.example`).

## Development

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build
```

## License

MIT
