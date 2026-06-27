import type { ImageCandidate } from '@muse/shared';
import {
  buildDiscoveryPrompt,
  buildStrictRetryReminder,
  type DiscoveryPromptInput,
} from './codex-prompt.js';
import {
  type CodexRunResult,
  type CodexRunner,
  extractLastAgentMessage,
  runCodexExec,
} from './codex-runner.js';
import { normalizeDiscoveryItems } from './normalize.js';
import { extractFirstJsonArray, stripAnsi } from './parse.js';

export type DiscoverImagesInput = DiscoveryPromptInput & {
  model?: string;
  cwd?: string;
  timeoutMs?: number;
};

export type DiscoverImagesDeps = {
  runner?: CodexRunner;
};

export class CodexDiscoveryError extends Error {
  readonly rawOutput: string;

  constructor(message: string, rawOutput: string) {
    super(message);
    this.name = 'CodexDiscoveryError';
    this.rawOutput = rawOutput;
  }
}

// Prefer the clean `--output-last-message` file; fall back to the JSONL agent message.
function resolveMessage(result: CodexRunResult): string | null {
  if (result.lastMessage !== null && result.lastMessage.trim() !== '') {
    return result.lastMessage;
  }
  return extractLastAgentMessage(result.stdout);
}

function tryParse(result: CodexRunResult): ImageCandidate[] | null {
  const message = resolveMessage(result);
  if (message === null) {
    return null;
  }
  const arrayText = extractFirstJsonArray(stripAnsi(message));
  if (arrayText === null) {
    return null;
  }
  try {
    return normalizeDiscoveryItems(arrayText);
  } catch {
    return null;
  }
}

// The one public entry point of the seam. Everything Codex-specific is reached only through here;
// callers receive normalized ImageCandidate[] or a CodexDiscoveryError with the raw output attached.
export async function discoverImages(
  input: DiscoverImagesInput,
  deps: DiscoverImagesDeps = {},
): Promise<ImageCandidate[]> {
  const runner = deps.runner ?? runCodexExec;
  const runOptions = { model: input.model, cwd: input.cwd, timeoutMs: input.timeoutMs };
  const basePrompt = buildDiscoveryPrompt(input);

  const first = await runner({ prompt: basePrompt, ...runOptions });
  const firstParsed = tryParse(first);
  if (firstParsed !== null && firstParsed.length > 0) {
    return firstParsed;
  }

  const retryPrompt = `${basePrompt}\n\n${buildStrictRetryReminder()}`;
  const second = await runner({ prompt: retryPrompt, ...runOptions });
  const secondParsed = tryParse(second);
  if (secondParsed !== null) {
    return secondParsed;
  }

  const rawOutput = resolveMessage(second) ?? second.stdout;
  throw new CodexDiscoveryError(
    'Failed to parse Codex discovery output after one retry',
    rawOutput,
  );
}
