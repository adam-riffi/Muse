import { type DesignTokens, DesignTokensSchema, type MoodboardAnalysis } from '@muse/shared';

// Pure: project a MoodboardAnalysis onto the deterministic design-tokens shape. No IO, no model
// calls — tokens are a faithful re-shaping of already-computed analysis.
export function renderDesignTokens(analysis: MoodboardAnalysis): DesignTokens {
  return DesignTokensSchema.parse({
    palette: analysis.palette,
    typography: analysis.typography,
    spacing: analysis.spacing,
  });
}
