---
'@muse/backend': minor
---

Add a GitHub Copilot CLI adapter behind the same discovery/proposition runner seam and CLI
detection. `AGENT_CLI` (`codex` default | `copilot`) selects the engine; the Copilot adapter drives
`copilot -p … --allow-all-tools --output-format json` and parses the terminal `assistant.message`.
`GET /health` now reports the detected agent (`{ provider, bin, available, version }`, cached), the
entrypoint logs a warning when the configured CLI is missing, and `detectCli` safely probes
`<bin> --version`. Binary overrides via `CODEX_BIN` / `COPILOT_BIN`.
