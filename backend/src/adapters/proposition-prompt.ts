export type PropositionPromptInput = {
  brief: string;
  refinements?: string[];
  count?: number;
};

const DEFAULT_COUNT = 4;

const FIELDS = '{ "label", "descriptor", "query", "previewUrl" }';

export function buildPropositionPrompt({
  brief,
  refinements = [],
  count = DEFAULT_COUNT,
}: PropositionPromptInput): string {
  const refinementBlock =
    refinements.length > 0
      ? `\nAlready-chosen direction (propose distinct sub-styles WITHIN this): ${refinements.join('; ')}.`
      : '';

  return [
    'You are a visual-style scout refining a moodboard brief into distinct sub-styles.',
    `For this brief: "${brief.trim()}".${refinementBlock}`,
    `Propose ${count} DISTINCT sub-styles that differ meaningfully in aesthetic direction.`,
    'For each sub-style provide:',
    '- "label": a short name (1-3 words), e.g. "Ghibli" or "Y2K".',
    '- "descriptor": one phrase describing the aesthetic, suitable to sharpen an image search.',
    '- "query": a concrete web-search query that would surface this sub-style.',
    '- "previewUrl": a direct link to ONE representative image file (jpg/png/webp) via web search.',
    '',
    `Return ONLY a JSON array of objects with EXACTLY these fields: ${FIELDS}.`,
    'No prose, no markdown fences — output must start with "[" and end with "]".',
  ].join('\n');
}

export function buildPropositionRetryReminder(): string {
  return [
    'Your previous response could not be parsed as a strict JSON array.',
    `Return ONLY a JSON array of objects with fields ${FIELDS}.`,
    'Output must start with "[" and end with "]". No prose, no markdown fences, no trailing text.',
  ].join('\n');
}
