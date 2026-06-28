---
'@muse/backend': minor
---

Add `POST /synthesize {imageIds}`: resolve the kept images from the session store, fetch their
bytes, run deterministic palette extraction and the VLM analysis, and merge both into a complete
`MoodboardAnalysis`. Returns 400 for unknown/empty ids, 501 when no VLM provider is configured, and
502 on a VLM parse failure. The synthesizer is injectable, so route tests stay hermetic.
