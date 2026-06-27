import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type CodexRunInput = {
  prompt: string;
  model?: string;
  cwd?: string;
  timeoutMs?: number;
};

export type CodexRunResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  /** Final agent message read from `--output-last-message`, if the file was written. */
  lastMessage: string | null;
  timedOut: boolean;
};

/** Injectable seam: the orchestration depends on this signature so tests can supply a fake. */
export type CodexRunner = (input: CodexRunInput) => Promise<CodexRunResult>;

const DEFAULT_TIMEOUT_MS = 120_000;

// Pure: the exact non-interactive invocation, isolated for testing. `--color never` + `--ephemeral`
// + `--skip-git-repo-check` keep output clean and side-effect-free; the prompt is always last.
export function buildCodexExecArgs(input: CodexRunInput, lastMessagePath: string): string[] {
  const args = [
    'exec',
    '--json',
    '--color',
    'never',
    '--skip-git-repo-check',
    '--ephemeral',
    '--output-last-message',
    lastMessagePath,
  ];
  if (input.model !== undefined) {
    args.push('--model', input.model);
  }
  args.push(input.prompt);
  return args;
}

type AgentMessageEvent = { type: 'item.completed'; item: { type: 'agent_message'; text: string } };

function isAgentMessageEvent(event: unknown): event is AgentMessageEvent {
  if (typeof event !== 'object' || event === null) {
    return false;
  }
  const e = event as Record<string, unknown>;
  if (e.type !== 'item.completed' || typeof e.item !== 'object' || e.item === null) {
    return false;
  }
  const item = e.item as Record<string, unknown>;
  return item.type === 'agent_message' && typeof item.text === 'string';
}

// Pure fallback: when the last-message file is absent, recover the final agent message from the
// `--json` JSONL event stream (the last `item.completed` of type `agent_message`).
export function extractLastAgentMessage(stdout: string): string | null {
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
    if (isAgentMessageEvent(event)) {
      last = event.item.text;
    }
  }
  return last;
}

export const runCodexExec: CodexRunner = async (input) => {
  const bin = process.env.CODEX_BIN ?? 'codex';
  const timeoutMs = (input.timeoutMs ?? Number(process.env.CODEX_TIMEOUT_MS)) || DEFAULT_TIMEOUT_MS;
  const dir = await mkdtemp(join(tmpdir(), 'muse-codex-'));
  const lastMessagePath = join(dir, 'last-message.txt');
  const args = buildCodexExecArgs(input, lastMessagePath);

  try {
    return await new Promise<CodexRunResult>((resolve, reject) => {
      const child = spawn(bin, args, { cwd: input.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
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
        void readFileSafe(lastMessagePath).then((lastMessage) => {
          resolve({ exitCode: code, stdout, stderr, lastMessage, timedOut });
        });
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
};

async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}
