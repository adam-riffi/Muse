import { MoodboardAnalysisSchema } from '@muse/shared';
import { imageId } from '@muse/shared/hash';
import { z } from 'zod';
import { extractFirstJsonObject, stripAnsi } from '../adapters/parse.js';

// The VLM derives everything except the palette (palette is deterministic, from pixels).
export const VlmAnalysisSchema = MoodboardAnalysisSchema.omit({ palette: true });
export type VlmAnalysis = z.infer<typeof VlmAnalysisSchema>;

/** A base64-encoded image handed to the VLM provider. */
export type VlmImage = { mediaType: string; data: string };

/** Provider abstraction: turn a prompt + images into raw text. Implemented per vendor. */
export type VlmProvider = {
  readonly name: string;
  complete(prompt: string, images: readonly VlmImage[]): Promise<string>;
};

export type AnalyzeInput = { images: readonly VlmImage[]; context?: string };

export type VlmAnalyzer = {
  analyze(input: AnalyzeInput): Promise<VlmAnalysis>;
};

export class VlmAnalysisError extends Error {
  readonly rawOutput: string;

  constructor(message: string, rawOutput: string) {
    super(message);
    this.name = 'VlmAnalysisError';
    this.rawOutput = rawOutput;
  }
}

const SCHEMA_HINT = `{
  "typography": { "style": string, "notes": string },
  "spacing": { "density": "tight" | "balanced" | "airy", "notes": string },
  "mood": string[],
  "motifs": string[],
  "summary": string
}`;

export function buildVlmPrompt(context?: string): string {
  const lines = [
    'You are a design analyst. Study the provided reference images as one moodboard and describe',
    'their shared design intent. Do NOT describe colors or a palette — that is computed separately.',
    '',
    'Respond with a SINGLE JSON object and nothing else. No prose, no markdown fences. Shape:',
    SCHEMA_HINT,
  ];
  if (context !== undefined && context.trim() !== '') {
    lines.push('', `Additional context from the curator: ${context.trim()}`);
  }
  return lines.join('\n');
}

export function buildVlmRetryReminder(): string {
  return [
    'Your previous reply could not be parsed.',
    'Reply with ONLY the JSON object described above — no prose, no markdown fences, no palette.',
  ].join(' ');
}

function imageSetHash(images: readonly VlmImage[], context?: string): string {
  const key = images.map((image) => `${image.mediaType}:${image.data}`).join('|');
  return imageId(`${key}::${context ?? ''}`);
}

function parseAnalysis(raw: string): VlmAnalysis | null {
  const objectText = extractFirstJsonObject(stripAnsi(raw));
  if (objectText === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(objectText);
  } catch {
    return null;
  }
  const result = VlmAnalysisSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export type VlmAnalyzerDeps = { provider: VlmProvider };

// Mirrors the Codex seam discipline: one call, defensive parse (bracket scan + zod), one stricter
// retry, then fail with the raw output attached. Cached by the (images + context) hash so a repeat
// synthesis of the same kept set never calls the provider twice.
export function createVlmAnalyzer(deps: VlmAnalyzerDeps): VlmAnalyzer {
  const cache = new Map<string, VlmAnalysis>();

  return {
    async analyze(input) {
      const key = imageSetHash(input.images, input.context);
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const prompt = buildVlmPrompt(input.context);
      const first = await deps.provider.complete(prompt, input.images);
      let analysis = parseAnalysis(first);

      if (analysis === null) {
        const retryPrompt = `${prompt}\n\n${buildVlmRetryReminder()}`;
        const second = await deps.provider.complete(retryPrompt, input.images);
        analysis = parseAnalysis(second);
        if (analysis === null) {
          throw new VlmAnalysisError('Failed to parse VLM analysis after one retry', second);
        }
      }

      cache.set(key, analysis);
      return analysis;
    },
  };
}
