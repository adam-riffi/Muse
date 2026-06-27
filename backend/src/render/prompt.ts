import type { MoodboardAnalysis } from '@muse/shared';

// Pure: render an agent-ready prompt (Markdown) that downstream generators can consume to produce
// work consistent with the synthesized design intent.
export function renderPrompt(analysis: MoodboardAnalysis): string {
  const palette = analysis.palette.map((swatch) => `- ${swatch.role}: ${swatch.hex}`).join('\n');

  const lines = [
    'Design an asset that matches the following moodboard intent.',
    '',
    `## Summary`,
    analysis.summary,
    '',
    '## Palette (use these as the core colors)',
    palette,
    '',
    '## Typography',
    `${analysis.typography.style} — ${analysis.typography.notes}`,
    '',
    '## Spacing',
    `${analysis.spacing.density} — ${analysis.spacing.notes}`,
    '',
    '## Mood',
    analysis.mood.join(', ') || '(none)',
    '',
    '## Motifs',
    analysis.motifs.join(', ') || '(none)',
    '',
    'Produce work that is consistent with this palette, typography, spacing, mood, and motifs.',
    '',
  ];

  return lines.join('\n');
}
