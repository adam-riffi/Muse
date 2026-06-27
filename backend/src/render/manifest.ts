import { type ImageCandidate, type Manifest, ManifestSchema } from '@muse/shared';

/** A kept image paired with its filename inside the bundle's `images/` directory. */
export type ManifestImageInput = { candidate: ImageCandidate; file: string };

// Pure: build manifest.json — the index of kept images and their provenance.
export function renderManifest(
  images: readonly ManifestImageInput[],
  generatedAt: string,
): Manifest {
  return ManifestSchema.parse({
    generatedAt,
    imageCount: images.length,
    images: images.map(({ candidate, file }) => ({
      id: candidate.id,
      file,
      source: candidate.source,
      url: candidate.url,
      ...(candidate.pageUrl !== undefined ? { pageUrl: candidate.pageUrl } : {}),
      ...(candidate.title !== undefined ? { title: candidate.title } : {}),
      rationale: candidate.rationale,
    })),
  });
}
