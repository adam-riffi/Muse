---
'@muse/backend': minor
---

Add a Copilot-CLI vision provider so synthesis/export works **without an API key**. Set
`VLM_PROVIDER=copilot` and the backend drives the locally-authenticated GitHub Copilot CLI for the
moodboard analysis: it normalizes the kept images to PNGs, attaches them with `--attachment`, runs a
one-shot prompt, and parses the result through the existing VLM analyzer. Previously `/synthesize`
(and the Export button) returned 501 unless an Anthropic/OpenAI key was configured. Verified live
(Copilot returned a complete, parseable analysis in ~14s).
