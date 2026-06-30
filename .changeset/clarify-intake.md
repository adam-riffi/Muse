---
'@muse/shared': minor
'@muse/backend': minor
'@muse/frontend': minor
---

Ask clarifying questions before the search. After the brief, an intake agent asks a few short,
high-signal questions to narrow the visual direction, and the answers seed the proposition/discovery
refinements. New `@muse/shared` `Clarify*` contracts, a `createClarifier` agent seam (defensive
JSON parse + retry + timeout-aware, no web search so it's fast), `POST /clarify`, and a frontend
clarify store + `ClarifyForm` wired into the flow (with skip / "search anyway" escape hatches).
