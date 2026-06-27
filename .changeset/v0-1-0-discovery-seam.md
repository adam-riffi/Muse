---
'@muse/shared': minor
'@muse/backend': minor
---

v0.1.0 — Codex discovery seam. Shared zod contracts (`ImageCandidate`, `MoodboardAnalysis`, export
bundle), the Fastify backend skeleton, the isolated Codex adapter (verified `codex exec` invocation,
defensive ANSI/JSON parsing, retry-once with graceful failure), an in-memory session store, and
`POST /discover`. Validated live end-to-end: a brief returns normalized `ImageCandidate[]` from real
Codex web search.
