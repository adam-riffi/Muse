---
'@muse/frontend': patch
---

Harden the frontend↔backend boundary for future UI refactors: split `api/` into `config` (API_BASE),
`client` (the single network seam), and `urls` (pure URL builders); move `thumbnailUrl` out of the
network client so components no longer import it. Add ESLint guardrails — the frontend can't import
backend code, and components can't import the network client (they go through stores). Documented the
layering in `docs/ARCHITECTURE.md`.
