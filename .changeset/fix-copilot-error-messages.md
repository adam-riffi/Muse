---
'@muse/backend': patch
---

Turn cryptic GitHub Copilot vision errors into clear, actionable messages so the user learns the
*real* problem and how to recover. A new `describeCopilotError` helper translates the raw Copilot CLI
error before it becomes a `VlmProviderError`: an exhausted **monthly quota** now reads "Your GitHub
Copilot monthly request quota is used up… wait for it to reset, or set VLM_PROVIDER=anthropic/openai
(with an API key) in backend/.env", with similar guidance for rate limiting and an unauthenticated
CLI. Unrecognized errors pass through unchanged. This is what surfaces in the UI when synthesis fails.
