import { z } from 'zod';

/** Known provenance tags for a candidate's `source` field. The field itself stays a free string. */
export const ImageSource = {
  CodexWebsearch: 'codex:websearch',
  Unsplash: 'unsplash',
  Openverse: 'openverse',
} as const;

export type ImageSourceTag = (typeof ImageSource)[keyof typeof ImageSource];

/** A single image reference proposed during discovery. `id` is the SHA-256 of `url`. */
export const ImageCandidateSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  url: z.url(),
  pageUrl: z.url().optional(),
  title: z.string().optional(),
  rationale: z.string(),
});

export type ImageCandidate = z.infer<typeof ImageCandidateSchema>;
