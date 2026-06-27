import { spawn } from 'node:child_process';
import type { AppConfig } from '../config.js';

export type AgentProvider = 'codex' | 'copilot';

export type CliStatus = {
  provider: AgentProvider;
  bin: string;
  available: boolean;
  version: string | null;
};

export type DetectOptions = {
  timeoutMs?: number;
  spawnImpl?: typeof spawn;
};

const DEFAULT_TIMEOUT_MS = 4000;
const VERSION_PATTERN = /(\d+\.\d+\.\d+)/;

// Probe a CLI by running `<bin> --version`. Resolves available:false (never rejects) when the binary
// is missing or errors — detection must be safe to call from a health check.
export function detectCli(
  bin: string,
  options: DetectOptions = {},
): Promise<{ available: boolean; version: string | null }> {
  const spawnImpl = options.spawnImpl ?? spawn;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    const done = (result: { available: boolean; version: string | null }): void => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    let child: ReturnType<typeof spawnImpl>;
    try {
      child = spawnImpl(bin, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      done({ available: false, version: null });
      return;
    }

    let stdout = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      done({ available: false, version: null });
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.on('error', () => {
      clearTimeout(timer);
      done({ available: false, version: null });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const match = VERSION_PATTERN.exec(stdout);
      done({ available: code === 0, version: match?.[1] ?? null });
    });
  });
}

function binFor(config: AppConfig): { provider: AgentProvider; bin: string } {
  if (config.agentCli === 'copilot') {
    return { provider: 'copilot', bin: process.env.COPILOT_BIN ?? 'copilot' };
  }
  return { provider: 'codex', bin: process.env.CODEX_BIN ?? 'codex' };
}

// Detect the agent CLI the app is configured to drive (`AGENT_CLI`).
export async function detectAgentCli(
  config: AppConfig,
  options?: DetectOptions,
): Promise<CliStatus> {
  const { provider, bin } = binFor(config);
  const { available, version } = await detectCli(bin, options);
  return { provider, bin, available, version };
}
