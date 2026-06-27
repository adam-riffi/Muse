import type { MoodboardAnalysis } from '@muse/shared';
import type { ManifestImageInput } from './manifest.js';

function bullets(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- (none)';
}

function reference({ candidate }: ManifestImageInput): string {
  const label = candidate.title ?? candidate.url;
  const href = candidate.pageUrl ?? candidate.url;
  return `- [${label}](${href}) — ${candidate.rationale}`;
}

// Pure: render the human-readable design brief (Markdown) from the analysis and the kept images.
export function renderDesignBrief(
  analysis: MoodboardAnalysis,
  images: readonly ManifestImageInput[] = [],
): string {
  const paletteRows = analysis.palette
    .map((swatch) => `| ${swatch.role} | \`${swatch.hex}\` |`)
    .join('\n');

  const sections = [
    '# Design Brief',
    '',
    analysis.summary,
    '',
    '## Palette',
    '',
    '| Role | Hex |',
    '| --- | --- |',
    paletteRows,
    '',
    '## Typography',
    '',
    `- **Style:** ${analysis.typography.style}`,
    `- ${analysis.typography.notes}`,
    '',
    '## Spacing',
    '',
    `- **Density:** ${analysis.spacing.density}`,
    `- ${analysis.spacing.notes}`,
    '',
    '## Mood',
    '',
    bullets(analysis.mood),
    '',
    '## Motifs',
    '',
    bullets(analysis.motifs),
    '',
    '## References',
    '',
    images.length > 0 ? images.map(reference).join('\n') : '- (none)',
    '',
  ];

  return sections.join('\n');
}
