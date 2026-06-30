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
  const subject = brief.trim();

  const lines = [
    'You are a visual-style scout refining a moodboard brief into distinct sub-styles.',
    `Brief — every sub-style MUST be a clear variation of THIS subject, never a tangent: "${subject}".`,
    'Read it as a VISUAL / design aesthetic (interpret ambiguous words as design intent, not literal objects).',
  ];

  if (refinements.length > 0) {
    lines.push(`Already-chosen direction (stay within this): ${refinements.join('; ')}.`);
  }

  lines.push(
    `Propose ${count} DISTINCT sub-styles that each still unmistakably read as the brief but differ in aesthetic treatment.`,
    'For each sub-style provide:',
    '- "label": a short name (1-3 words), e.g. "Ghibli" or "Y2K".',
    '- "descriptor": one phrase describing the aesthetic, consistent with the brief, suitable to sharpen an image search.',
    '- "query": a concrete web-search query that surfaces THIS sub-style FOR THIS brief.',
    '- "previewUrl": a direct image link (jpg/png/webp) that genuinely EXEMPLIFIES this descriptor — not a generic or loosely related image. The preview must match the descriptor so a user can pick by sight.',
    '',
    `Return ONLY a JSON array of objects with EXACTLY these fields: ${FIELDS}.`,
    'No prose, no markdown fences — output must start with "[" and end with "]".',
  );

  return lines.join('\n');
}

export function buildPropositionRetryReminder(): string {
  return [
    'Your previous response could not be parsed as a strict JSON array.',
    `Return ONLY a JSON array of objects with fields ${FIELDS}.`,
    'Output must start with "[" and end with "]". No prose, no markdown fences, no trailing text.',
  ].join('\n');
}
