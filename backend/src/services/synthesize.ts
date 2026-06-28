import { type MoodboardAnalysis, MoodboardAnalysisSchema, type PaletteSwatch } from '@muse/shared';
import type { FetchedImage } from './image-fetch.js';
import { extractPalette as defaultExtractPalette } from './palette.js';
import type { SessionStore } from './store.js';
import type { VlmAnalyzer, VlmImage } from './vlm.js';

export class SynthesizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SynthesizeError';
  }
}

export type Synthesizer = {
  synthesize(imageIds: readonly string[]): Promise<MoodboardAnalysis>;
};

export type SynthesizerDeps = {
  store: SessionStore;
  fetchImage: (url: string) => Promise<FetchedImage>;
  analyzer: VlmAnalyzer;
  extractPalette?: (images: readonly Buffer[]) => Promise<PaletteSwatch[]>;
};

// Joins the two synthesis halves: the deterministic palette (from pixels) and the VLM analysis
// (everything else), producing a complete MoodboardAnalysis for the kept set.
export function createSynthesizer(deps: SynthesizerDeps): Synthesizer {
  const extractPalette = deps.extractPalette ?? defaultExtractPalette;
  return {
    async synthesize(imageIds) {
      const candidates = deps.store.getCandidates(imageIds);
      if (candidates.length === 0) {
        throw new SynthesizeError('No known images for the provided ids');
      }

      const buffers: Buffer[] = [];
      const images: VlmImage[] = [];
      for (const candidate of candidates) {
        try {
          const fetched = await deps.fetchImage(candidate.url);
          buffers.push(fetched.buffer);
          images.push({ mediaType: fetched.contentType, data: fetched.buffer.toString('base64') });
        } catch {
          // skip kept images that can't be fetched (dead/blocked links)
        }
      }
      if (images.length === 0) {
        throw new SynthesizeError(
          'Could not load any of the kept images (the links may be dead or blocked). Keep different references and try again.',
        );
      }

      const palette = await extractPalette(buffers);
      const vlm = await deps.analyzer.analyze({ images });
      return MoodboardAnalysisSchema.parse({ palette, ...vlm });
    },
  };
}
