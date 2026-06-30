import { z } from 'zod';
import { type ClarifyQuestion, type ClarifyResult } from '@muse/shared';
import { buildClarifyPrompt, buildClarifyRetryReminder } from './clarify-prompt.js';
import {
  type CodexRunResult,
  type CodexRunner,
  extractLastAgentMessage,
  runCodexExec,
} from './codex-runner.js';
import { extractAllJsonArrays, extractFirstJsonObject, stripAnsi } from './parse.js';

export type ClarifyEngineInput = {
  brief: string;
  count?: number;
  model?: string;
  cwd?: string;
  timeoutMs?: number;
};

export type ClarifyEngine = {
  clarify(input: ClarifyEngineInput): Promise<ClarifyResult>;
};

export type ClarifyEngineDeps = {
  runner?: CodexRunner;
};

export class ClarifyError extends Error {
  readonly rawOutput: string;

  constructor(message: string, rawOutput: string) {
    super(message);
    this.name = 'ClarifyError';
    this.rawOutput = rawOutput;
  }
}

const TIMEOUT_MESSAGE = 'The intake agent timed out. You can search anyway or try a shorter brief.';

// Tolerant of a missing id / extra fields; ids are synthesized so the model can't break us on them.
const RawQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1),
  hint: z.string().optional(),
});

function toQuestions(items: readonly unknown[], max: number): ClarifyQuestion[] {
  const out: ClarifyQuestion[] = [];
  for (const raw of items) {
    const parsed = RawQuestionSchema.safeParse(raw);
    if (!parsed.success) {
      continue;
    }
    out.push({
      id: parsed.data.id ?? `q${out.length + 1}`,
      question: parsed.data.question,
      ...(parsed.data.hint !== undefined ? { hint: parsed.data.hint } : {}),
    });
    if (out.length >= max) {
      break;
    }
  }
  return out;
}

// Returns the parsed questions (possibly empty = "brief is specific, no questions"), or null when no
// questions container was found at all (a genuine parse miss worth a retry). Tolerates a `{questions:[]}`
// object or a bare array, with or without a prose preamble.
function parseQuestions(message: string, max: number): ClarifyQuestion[] | null {
  const text = stripAnsi(message);

  const objectText = extractFirstJsonObject(text);
  if (objectText !== null) {
    try {
      const obj = JSON.parse(objectText) as { questions?: unknown };
      if (Array.isArray(obj.questions)) {
        return toQuestions(obj.questions, max);
      }
    } catch {
      // fall through to array scan
    }
  }

  for (const arrayText of extractAllJsonArrays(text)) {
    try {
      const arr: unknown = JSON.parse(arrayText);
      if (Array.isArray(arr)) {
        return toQuestions(arr, max);
      }
    } catch {
      continue;
    }
  }

  return null;
}

function resolveMessage(result: CodexRunResult): string | null {
  if (result.lastMessage !== null && result.lastMessage.trim() !== '') {
    return result.lastMessage;
  }
  return extractLastAgentMessage(result.stdout);
}

// Intake seam (mirrors the discovery/proposition discipline): one agent call → defensive JSON parse →
// one stricter retry → fail fast on timeout. No web search, so it stays fast.
export function createClarifier(deps: ClarifyEngineDeps = {}): ClarifyEngine {
  const runner = deps.runner ?? runCodexExec;

  return {
    async clarify(input) {
      const max = input.count ?? 3;
      const runOptions = { model: input.model, cwd: input.cwd, timeoutMs: input.timeoutMs };
      const basePrompt = buildClarifyPrompt(input);

      const first = await runner({ prompt: basePrompt, ...runOptions });
      const firstParsed = parseQuestions(resolveMessage(first) ?? '', max);
      if (firstParsed !== null) {
        return { questions: firstParsed };
      }
      if (first.timedOut) {
        throw new ClarifyError(TIMEOUT_MESSAGE, first.stdout);
      }

      const retryPrompt = `${basePrompt}\n\n${buildClarifyRetryReminder()}`;
      const second = await runner({ prompt: retryPrompt, ...runOptions });
      const secondParsed = parseQuestions(resolveMessage(second) ?? '', max);
      if (secondParsed !== null) {
        return { questions: secondParsed };
      }
      if (second.timedOut) {
        throw new ClarifyError(TIMEOUT_MESSAGE, second.stdout);
      }

      throw new ClarifyError(
        'Failed to parse clarify output after one retry',
        resolveMessage(second) ?? second.stdout,
      );
    },
  };
}
