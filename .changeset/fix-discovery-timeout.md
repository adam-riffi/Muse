---
'@muse/backend': patch
---

Fix the *real* cause of "Failed to parse Codex discovery output after one retry": it was a **timeout**,
not a parse error. Codex ran 20+ web searches for a 12-image request and got SIGKILLed at 120s, leaving
no final message — which surfaced as a misleading parse error. Now: fewer images by default (12 → 8),
the prompt tells the agent to search efficiently and stop early, the run timeout is raised to 240s, and
a timed-out run **fails fast with an accurate message** ("the discovery agent timed out … try a more
specific brief or fewer images") instead of a pointless identical retry. Same timeout handling added to
style propositions.
