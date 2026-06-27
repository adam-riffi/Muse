---
'@muse/backend': minor
---

Add the VLM analysis seam (`services/vlm.ts` + `services/vlm-providers.ts`): a provider
abstraction (Anthropic default / OpenAI), one multi-image call over the kept set producing the
non-palette half of `MoodboardAnalysis` (typography, spacing, mood, motifs, summary). Mirrors the
Codex discipline — defensive JSON parse (balanced-object scan + zod), one stricter retry, raw
output on failure — and caches by image-set hash. Provider HTTP is fully mocked in tests; no real
API or secrets in CI. Also adds `extractFirstJsonObject` to the parser utilities.
