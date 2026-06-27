---
'@muse/frontend': minor
---

Add the Playwright happy-path e2e (propose → refine → discover → curate → export), run against the
built SPA with all `/api` calls stubbed via `page.route` (fully hermetic — no backend, Codex, or
VLM), plus the CI/CD workflows: `e2e.yml` (Chromium), `release.yml` (tag → install tarball + GitHub
Release), and a manual self-hosted `codex-contract.yml` for live Codex drift checks. Finalizes the
docs (RUNBOOK, README). Milestone v1.0.0.
