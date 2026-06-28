import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AppConfig } from '../config.js';
import {
  type CodexRunInput,
  type CodexRunResult,
  type CodexRunner,
  createLineEmitter,
  runCodexExec,
} from './codex-runner.js';

// The discovery/proposition seam is engine-agnostic: both the Codex and the GitHub Copilot CLIs
// implement the same `CodexRunner` shape (prompt in → final agent message out). `AgentRunner` is
// the vendor-neutral name for that contract.
export type AgentRunner = CodexRunner;
export type AgentRunInput = CodexRunInput;
export type AgentRunResult = CodexRunResult;

const DEFAULT_TIMEOUT_MS = 240_000;

// Pure: the exact non-interactive Copilot invocation. `-p` runs a one-shot prompt; `--allow-all-tools`
// is required for non-interactive mode; `--output-format json` emits JSONL events we parse; `--no-color`
// and `--log-level none` keep the stream clean. The prompt is always last.
export function buildCopilotExecArgs(input: AgentRunInput): string[] {
  const args = [
    '--allow-all-tools',
    '--output-format',
    'json',
    '--no-color',
    '--log-level',
    'none',
  ];
  if (input.model !== undefined) {
    args.push('--model', input.model);
  }
  args.push('-p', input.prompt);
  return args;
}

type CopilotAssistantMessage = { type: 'assistant.message'; data: { content: string } };

function isCopilotAssistantMessage(event: unknown): event is CopilotAssistantMessage {
  if (typeof event !== 'object' || event === null) {
    return false;
  }
  const e = event as Record<string, unknown>;
  if (e.type !== 'assistant.message' || typeof e.data !== 'object' || e.data === null) {
    return false;
  }
  return typeof (e.data as Record<string, unknown>).content === 'string';
}

// Pure: recover the final assistant message from Copilot's `--output-format json` JSONL stream — the
// last terminal `assistant.message` event's `data.content`.
export function extractLastCopilotMessage(stdout: string): string | null {
  let last: string | null = null;
  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') {
      continue;
    }
    let event: unknown;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (isCopilotAssistantMessage(event)) {
      last = event.data.content;
    }
  }
  return last;
}

export const runCopilotExec: AgentRunner = async (input) => {
  const bin = process.env.COPILOT_BIN ?? 'copilot';
  const timeoutMs =
    (input.timeoutMs ?? Number(process.env.COPILOT_TIMEOUT_MS)) || DEFAULT_TIMEOUT_MS;
  // Run in a throwaway cwd so any session file Copilot writes never lands in the user's project.
  const dir = await mkdtemp(join(tmpdir(), 'muse-copilot-'));
  const args = buildCopilotExecArgs(input);

  try {
    return await new Promise<AgentRunResult>((resolve, reject) => {
      const child = spawn(bin, args, { cwd: input.cwd ?? dir, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      const lines = input.onStdoutLine ? createLineEmitter(input.onStdoutLine) : null;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      child.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stdout += text;
        lines?.push(text);
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        lines?.flush();
        resolve({
          exitCode: code,
          stdout,
          stderr,
          lastMessage: extractLastCopilotMessage(stdout),
          timedOut,
        });
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
};

// Picks the runner for the configured agent CLI. Defaults to Codex.
export function resolveAgentRunner(config: AppConfig): AgentRunner {
  return config.agentCli === 'copilot' ? runCopilotExec : runCodexExec;
}
