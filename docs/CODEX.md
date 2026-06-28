# Codex CLI integration

> All version-sensitive behavior is isolated in `backend/src/adapters/`. The rest of the app only
> ever sees normalized `ImageCandidate[]`. **Pin and re-verify this on every Codex upgrade.**

## Pinned version

- **`codex-cli 0.135.0`** (verified 2026-06-27). Auth: `codex login status` → "Logged in using ChatGPT".

## Non-interactive invocation

The adapter runs the `exec` subcommand:

```
codex exec --json --color never --skip-git-repo-check --ephemeral \
  --output-last-message <tmpfile> [--model <model>] "<discovery prompt>"
```

Flag rationale:

| Flag                       | Why                                                                 |
| -------------------------- | ------------------------------------------------------------------- |
| `exec`                     | Non-interactive run (alias `e`).                                    |
| `--json`                   | Emit JSONL events to stdout (machine-readable fallback parse source). |
| `--color never`            | Suppress ANSI (we still strip defensively).                         |
| `--skip-git-repo-check`    | The backend may run outside a git repo.                             |
| `--ephemeral`              | Do not persist session files — safe for a long-lived server.        |
| `--output-last-message`    | Write the agent's final message to a file (the clean parse source). |
| `--model`                  | Optional model override.                                            |

Stdin is set to **ignore**; when stdin is a pipe, Codex logs `Reading additional input from stdin…`
to stderr and waits, which we avoid entirely.

## Output format (observed)

`--json` stdout is JSONL:

```
{"type":"thread.started","thread_id":"…"}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"[ … ]"}}
{"type":"turn.completed","usage":{ … }}
```

`--output-last-message` file contains just the final `agent_message` text (no ANSI, no fences).

## Adapter parsing strategy (`backend/src/adapters/`)

1. `codex-prompt.ts` — build a prompt that ends with a strict "JSON array only, no prose/fences" rule.
2. `codex-runner.ts` — `runCodexExec` spawns the command above (timeout via `CODEX_TIMEOUT_MS`, binary
   via `CODEX_BIN`); `extractLastAgentMessage` recovers the message from JSONL if the file is missing.
3. `parse.ts` — `stripAnsi`, then `extractFirstJsonArray` (balanced-bracket scan that respects strings).
4. `normalize.ts` — validate each item `{ url, pageUrl?, title?, rationale }`, drop invalid ones,
   de-dup by url, assign `id = sha256(url)` and `source = "codex:websearch"`.
5. `codex.ts` — `discoverImages` ties it together: on unparseable output it retries **once** with a
   stricter reminder, then throws `CodexDiscoveryError` with the raw output attached.

## Environment variables

| Variable             | Default  | Purpose                                   |
| -------------------- | -------- | ----------------------------------------- |
| `CODEX_BIN`          | `codex`  | Path/name of the Codex binary.            |
| `CODEX_TIMEOUT_MS`   | `120000` | Hard timeout for a single `exec` run.     |

## Re-verifying after an upgrade

```bash
codex --version
codex exec --help        # confirm --json, --output-last-message, --color, --ephemeral still exist
npm run -w @muse/backend discover -- "a test brief"   # live seam check (added in PR #5)
```

If the JSONL event shape or flags change, update `codex-runner.ts` (and this file) only — the
contract boundary (`ImageCandidate[]`) must not change.
