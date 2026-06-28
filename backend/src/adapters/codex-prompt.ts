export type DiscoveryPromptInput = {
  brief: string;
  count?: number;
  /** Chosen style descriptors from the proposition rounds (wired in a later PR). */
  refinements?: string[];
};

const DEFAULT_COUNT = 8;

const FIELDS = '{ "url", "pageUrl", "title", "rationale" }';

export function buildDiscoveryPrompt({
  brief,
  count = DEFAULT_COUNT,
  refinements = [],
}: DiscoveryPromptInput): string {
  const refinementBlock =
    refinements.length > 0
      ? `\nRefined style direction (must strongly influence results): ${refinements.join('; ')}.`
      : '';

  return [
    'You are an image-reference scout for a frontend / creative-coding moodboard.',
    `Use web search to find ${count} real, directly-usable reference images that fit this brief:`,
    `"${brief.trim()}".${refinementBlock}`,
    '',
    'Requirements for each result:',
    '- "url" must be a direct link to an image file (jpg/png/webp/gif/avif), not an HTML page.',
    '- "pageUrl" is the page where the image was found (optional).',
    '- "title" is a short label (optional).',
    '- "rationale" is one sentence on why it fits the brief.',
    '- Prefer diverse, high-quality sources; avoid duplicates and broken links.',
    '',
    'Work efficiently: a few targeted web searches are enough — do not exhaust every source. Stop',
    'searching and return the array as soon as you have enough good results.',
    '',
    `Return ONLY a JSON array of objects with EXACTLY these fields: ${FIELDS}.`,
    'No prose, no explanation, no markdown code fences — output must start with "[" and end with "]".',
  ].join('\n');
}

export function buildStrictRetryReminder(): string {
  return [
    'Your previous response could not be parsed as a strict JSON array.',
    `Return ONLY a JSON array of objects with fields ${FIELDS}.`,
    'Output must start with "[" and end with "]". No prose, no markdown fences, no trailing text.',
  ].join('\n');
}
