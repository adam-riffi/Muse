---
'@muse/backend': minor
---

Add the export bundle: `services/export-bundle.ts` zips (deterministically, in memory via fflate)
the kept images plus the rendered `manifest.json`, `design-tokens.json`, `design-brief.md`,
`prompt.md`, `board.json`, and — when the client supplies it — the rasterized `board.png`.
`POST /export {imageIds, analysis, boardPng?}` streams the zip as `application/zip`; 400 for an
invalid body or unknown ids. Tests unzip the output and assert the bundle structure.
