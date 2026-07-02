---
'@muse/backend': patch
'@muse/frontend': patch
---

Surface the real reason synthesis/export fail instead of a bare status code. When the Copilot vision
model rejects a request (e.g. monthly quota exhausted), it throws a `VlmProviderError` that the
synthesize route previously let escape as an opaque 500. The route now catches it and returns a 502
with a clear message ("Vision model unavailable: …"). On the frontend, the API client used to throw
generic "Synthesis failed with status 500" / "Export failed with status 413" errors without reading
the response body; it now reads the backend's JSON `message` (via a shared `errorFrom` helper) so the
UI shows *why* it failed. Note: an exhausted Copilot quota is environmental — switch `VLM_PROVIDER` to
`openai`/`anthropic` (with an API key) or wait for the reset; discovery/propositions use Codex and are
unaffected.
