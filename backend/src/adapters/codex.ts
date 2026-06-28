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
import { normalizeDiscoveryArray } from './normalize.js';
import { extractAllJsonArrays, stripAnsi } from './parse.js';

export type DiscoverImagesInput = DiscoveryPromptInput & {
  model?: string;
  cwd?: string;
  timeoutMs?: number;
};

export type DiscoverImagesDeps = {
  runner?: CodexRunner;
  /** Optional: forwards each raw stdout line from the agent CLI (for streaming progress). */
  onStdoutLine?: (line: string) => void;
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

// Defensive parse: agents often wrap the array in a prose preamble and/or a ```json fence, which can
// contain stray brackets (markdown links, citations, example arrays). So we try EVERY balanced array
// in the message and return the first that yields ≥1 valid candidate. Returns null only when no
// array parses at all (a genuine failure worth a retry); an empty array means "parsed, no results".
function tryParse(result: CodexRunResult): ImageCandidate[] | null {
  const message = resolveMessage(result);
  if (message === null) {
    return null;
  }

  let sawArray = false;
  for (const arrayText of extractAllJsonArrays(stripAnsi(message))) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(arrayText);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) {
      continue;
    }
    sawArray = true;
    const items = normalizeDiscoveryArray(parsed);
    if (items.length > 0) {
      return items;
    }
  }

  return sawArray ? [] : null;
}

const TIMEOUT_MESSAGE =
  'The discovery agent timed out before returning results. Try a more specific brief or fewer images.';

// The one public entry point of the seam. Everything Codex-specific is reached only through here;
// callers receive normalized ImageCandidate[] or a CodexDiscoveryError with the raw output attached.
export async function discoverImages(
  input: DiscoverImagesInput,
  deps: DiscoverImagesDeps = {},
): Promise<ImageCandidate[]> {
  const runner = deps.runner ?? runCodexExec;
  const runOptions = {
    model: input.model,
    cwd: input.cwd,
    timeoutMs: input.timeoutMs,
    onStdoutLine: deps.onStdoutLine,
  };
  const basePrompt = buildDiscoveryPrompt(input);

  const first = await runner({ prompt: basePrompt, ...runOptions });
  const firstParsed = tryParse(first);
  if (firstParsed !== null && firstParsed.length > 0) {
    return firstParsed;
  }
  // A timed-out run produced no final message; an identical retry would just time out again, so fail
  // fast with an accurate message instead of the misleading "failed to parse".
  if (first.timedOut) {
    throw new CodexDiscoveryError(TIMEOUT_MESSAGE, first.stdout);
  }

  const retryPrompt = `${basePrompt}\n\n${buildStrictRetryReminder()}`;
  const second = await runner({ prompt: retryPrompt, ...runOptions });
  const secondParsed = tryParse(second);
  if (secondParsed !== null) {
    return secondParsed;
  }
  if (second.timedOut) {
    throw new CodexDiscoveryError(TIMEOUT_MESSAGE, second.stdout);
  }

  const rawOutput = resolveMessage(second) ?? second.stdout;
  throw new CodexDiscoveryError(
    'Failed to parse Codex discovery output after one retry',
    rawOutput,
  );
}
