import { z } from 'zod';
import {
  PaletteSwatchSchema,
  SpacingAnalysisSchema,
  TypographyAnalysisSchema,
} from './analysis.js';

/** One entry in the export manifest: a kept image with its provenance and downloaded filename. */
export const ManifestEntrySchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1), // path relative to images/ inside the bundle
  source: z.string().min(1),
  url: z.url(),
  pageUrl: z.url().optional(),
  title: z.string().optional(),
  rationale: z.string(),
});
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

/** manifest.json — the index of kept images in the export bundle. */
export const ManifestSchema = z.object({
  generatedAt: z.iso.datetime(),
  imageCount: z.number().int().nonnegative(),
  images: z.array(ManifestEntrySchema),
});
export type Manifest = z.infer<typeof ManifestSchema>;

/** design-tokens.json — deterministic palette (from pixels) + VLM typography/spacing. */
export const DesignTokensSchema = z.object({
  palette: z.array(PaletteSwatchSchema),
  typography: TypographyAnalysisSchema,
  spacing: SpacingAnalysisSchema,
});
export type DesignTokens = z.infer<typeof DesignTokensSchema>;
