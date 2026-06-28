---
'@muse/shared': minor
'@muse/backend': minor
'@muse/frontend': minor
---

Stream the agent's progress during discovery so the UI shows what it's thinking/searching instead of
a spinner. The agent CLIs' JSONL is normalized to a small `AgentStreamEvent` union (status / reasoning
/ search / tool) — Codex web-search items and Copilot reasoning deltas + tool calls. New SSE endpoint
`GET /discover/stream` relays activity then a terminal `result`. The frontend consumes it via
EventSource (with a graceful non-streaming fallback) and renders a live `DiscoveryActivity` feed
(reasoning coalesced into a flowing thought, 🔎 search queries surfaced).
