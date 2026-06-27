import { z } from 'zod';

export const PaletteRoleSchema = z.enum(['dominant', 'accent', 'neutral', 'background']);
export type PaletteRole = z.infer<typeof PaletteRoleSchema>;

/** A 6-digit hex color, e.g. "#1a2b3c". */
export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Expected a 6-digit hex color like #1a2b3c');
export type HexColor = z.infer<typeof HexColorSchema>;

export const PaletteSwatchSchema = z.object({
  hex: HexColorSchema,
  role: PaletteRoleSchema,
});
export type PaletteSwatch = z.infer<typeof PaletteSwatchSchema>;

export const SpacingDensitySchema = z.enum(['tight', 'balanced', 'airy']);
export type SpacingDensity = z.infer<typeof SpacingDensitySchema>;

export const TypographyAnalysisSchema = z.object({
  style: z.string(),
  notes: z.string(),
});
export type TypographyAnalysis = z.infer<typeof TypographyAnalysisSchema>;

export const SpacingAnalysisSchema = z.object({
  density: SpacingDensitySchema,
  notes: z.string(),
});
export type SpacingAnalysis = z.infer<typeof SpacingAnalysisSchema>;

// Only `palette` is computed deterministically (from pixels); typography, spacing, mood, motifs,
// and summary all come from the single VLM pass.
export const MoodboardAnalysisSchema = z.object({
  palette: z.array(PaletteSwatchSchema),
  typography: TypographyAnalysisSchema,
  spacing: SpacingAnalysisSchema,
  mood: z.array(z.string()),
  motifs: z.array(z.string()),
  summary: z.string(),
});
export type MoodboardAnalysis = z.infer<typeof MoodboardAnalysisSchema>;
