import { z } from 'zod';
import {
  type ImageCandidate,
  ImageSource,
  type PropositionOption,
  type PropositionRound,
} from '@muse/shared';
import { imageId } from '@muse/shared/hash';
import {
  type CodexRunner,
  type CodexRunResult,
  extractLastAgentMessage,
  runCodexExec,
} from './codex-runner.js';
import { extractAllJsonArrays, stripAnsi } from './parse.js';
import { buildPropositionPrompt, buildPropositionRetryReminder } from './proposition-prompt.js';

const RawVariantSchema = z.object({
  label: z.string().min(1),
  descriptor: z.string().min(1),
  query: z.string().min(1),
  previewUrl: z.url().optional(),
});

export type ProposeStylesInput = {
  brief: string;
  refinements?: string[];
  count?: number;
  model?: string;
  cwd?: string;
  timeoutMs?: number;
};

export type PropositionEngine = {
  propose(input: ProposeStylesInput): Promise<PropositionRound>;
};

export type PropositionEngineDeps = {
  runner?: CodexRunner;
};

export class PropositionError extends Error {
  readonly rawOutput: string;

  constructor(message: string, rawOutput: string) {
    super(message);
    this.name = 'PropositionError';
    this.rawOutput = rawOutput;
  }
}

function roundId(brief: string, refinements: readonly string[]): string {
  return imageId(`${brief}::${refinements.join('|')}`);
}

function optionId(label: string, descriptor: string): string {
  return imageId(`${label}::${descriptor}`);
}

function resolveMessage(result: CodexRunResult): string | null {
  if (result.lastMessage !== null && result.lastMessage.trim() !== '') {
    return result.lastMessage;
  }
  return extractLastAgentMessage(result.stdout);
}

function buildOptions(parsed: readonly unknown[]): PropositionOption[] {
  const options: PropositionOption[] = [];
  const seen = new Set<string>();
  for (const raw of parsed) {
    const result2 = RawVariantSchema.safeParse(raw);
    if (!result2.success) {
      continue;
    }
    const variant = result2.data;
    const id = optionId(variant.label, variant.descriptor);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    const preview: ImageCandidate | undefined =
      variant.previewUrl !== undefined
        ? {
            id: imageId(variant.previewUrl),
            source: ImageSource.CodexWebsearch,
            url: variant.previewUrl,
            rationale: variant.descriptor,
          }
        : undefined;

    options.push({
      id,
      label: variant.label,
      descriptor: variant.descriptor,
      query: variant.query,
      ...(preview !== undefined ? { preview } : {}),
    });
  }
  return options;
}

// Defensive parse mirroring discovery: try every balanced array in the message (the model often adds
// a prose preamble / ```json fence with stray brackets) and return the first that yields ≥1 option.
function parseOptions(result: CodexRunResult): PropositionOption[] | null {
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
    const options = buildOptions(parsed);
    if (options.length > 0) {
      return options;
    }
  }

  return sawArray ? [] : null;
}

// A second agentic seam: reuses the Codex runner + defensive parsing to turn a brief into distinct
// sub-style options, each with an optional preview candidate. Cached by (brief + refinements).
export function createPropositionEngine(deps: PropositionEngineDeps = {}): PropositionEngine {
  const runner = deps.runner ?? runCodexExec;
  const cache = new Map<string, PropositionRound>();

  return {
    async propose(input) {
      const refinements = input.refinements ?? [];
      const id = roundId(input.brief, refinements);
      const cached = cache.get(id);
      if (cached !== undefined) {
        return cached;
      }

      const runOptions = { model: input.model, cwd: input.cwd, timeoutMs: input.timeoutMs };
      const basePrompt = buildPropositionPrompt(input);

      const first = await runner({ prompt: basePrompt, ...runOptions });
      let options = parseOptions(first);

      if (options === null || options.length === 0) {
        const retryPrompt = `${basePrompt}\n\n${buildPropositionRetryReminder()}`;
        const second = await runner({ prompt: retryPrompt, ...runOptions });
        const retried = parseOptions(second);
        if (retried === null) {
          throw new PropositionError(
            'Failed to parse proposition output after one retry',
            resolveMessage(second) ?? second.stdout,
          );
        }
        options = retried;
      }

      const round: PropositionRound = { id, brief: input.brief, refinements, options };
      cache.set(id, round);
      return round;
    },
  };
}
