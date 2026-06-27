---
'@muse/backend': minor
---

Add the export-bundle renderers (`backend/src/render/`): pure, deterministic functions that turn a
`MoodboardAnalysis` + the kept images into the bundle artifacts — `design-tokens.json`
(`renderDesignTokens`), `manifest.json` (`renderManifest`), `design-brief.md` (`renderDesignBrief`),
and an agent-ready `prompt.md` (`renderPrompt`). No IO and no model calls — milestone v0.3.0,
synthesis produces all bundle artifacts.
