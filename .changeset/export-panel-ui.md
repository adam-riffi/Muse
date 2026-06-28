---
'@muse/frontend': minor
---

Add the export panel UI: a one-click flow that synthesizes the kept references (`/synthesize`),
rasterizes the tldraw board to a PNG (`editor.toImage`, best-effort), posts to `/export`, and
downloads the returned zip. Adds `synthesize`/`exportBundle` to the API client, a board-store
`getBoardPng()` rasterizer, an export store with idle/loading/success/error states, and an
accessible `ExportPanel` (status/alert regions, labelled button).
