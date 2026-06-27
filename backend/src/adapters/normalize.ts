import { z } from 'zod';
import { type ImageCandidate, ImageCandidateSchema, ImageSource } from '@muse/shared';
import { imageId } from '@muse/shared/hash';

/** The raw per-item shape Codex is instructed to emit (before we assign id/source). */
export const RawDiscoveryItemSchema = z.object({
  url: z.url(),
  pageUrl: z.url().optional(),
  title: z.string().optional(),
  rationale: z.string().default(''),
});
export type RawDiscoveryItem = z.infer<typeof RawDiscoveryItemSchema>;

// Parse extracted JSON text into normalized ImageCandidate[]. Individually invalid items are
// dropped (resilient to a single bad entry); a non-array or unparseable payload throws so the
// orchestration can retry once and then fail gracefully.
export function normalizeDiscoveryItems(jsonText: string): ImageCandidate[] {
  const parsed: unknown = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) {
    throw new Error('Discovery output is not a JSON array');
  }

  const seen = new Set<string>();
  const candidates: ImageCandidate[] = [];

  for (const raw of parsed) {
    const result = RawDiscoveryItemSchema.safeParse(raw);
    if (!result.success) {
      continue;
    }

    const item = result.data;
    const id = imageId(item.url);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    candidates.push(
      ImageCandidateSchema.parse({
        id,
        source: ImageSource.CodexWebsearch,
        url: item.url,
        ...(item.pageUrl !== undefined ? { pageUrl: item.pageUrl } : {}),
        ...(item.title !== undefined ? { title: item.title } : {}),
        rationale: item.rationale,
      }),
    );
  }

  return candidates;
}
