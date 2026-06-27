import { describe, expect, it, vi } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { createSessionStore } from './store.js';
import { createSynthesizer, SynthesizeError } from './synthesize.js';
import type { VlmAnalysis, VlmAnalyzer } from './vlm.js';

const vlm: VlmAnalysis = {
  typography: { style: 'serif', notes: 'classic' },
  spacing: { density: 'balanced', notes: 'even' },
  mood: ['warm'],
  motifs: ['arches'],
  summary: 'A warm classical board.',
};

function candidate(id: string, url: string): ImageCandidate {
  return { id, source: 'codex:websearch', url, rationale: 'fits' };
}

function storeWith(candidates: ImageCandidate[]) {
  const store = createSessionStore();
  store.putCandidates(candidates);
  return store;
}

const analyzer: VlmAnalyzer = { analyze: async () => vlm };

describe('createSynthesizer', () => {
  it('fetches kept images, extracts a palette, and merges the VLM analysis', async () => {
    const store = storeWith([
      candidate('a', 'https://x.com/a.jpg'),
      candidate('b', 'https://x.com/b.jpg'),
    ]);
    const fetchImage = vi.fn(async (url: string) => ({
      buffer: Buffer.from(`bytes:${url}`),
      contentType: 'image/png',
      bytes: 6,
    }));
    const analyze = vi.fn(analyzer.analyze);
    const synthesizer = createSynthesizer({
      store,
      fetchImage,
      analyzer: { analyze },
      extractPalette: async () => [{ hex: '#112233', role: 'dominant' }],
    });

    const analysis = await synthesizer.synthesize(['a', 'b']);

    expect(fetchImage).toHaveBeenCalledTimes(2);
    expect(analysis.palette).toEqual([{ hex: '#112233', role: 'dominant' }]);
    expect(analysis.summary).toBe('A warm classical board.');
    const passedImages = analyze.mock.calls[0]?.[0].images;
    expect(passedImages).toHaveLength(2);
    expect(passedImages?.[0]?.mediaType).toBe('image/png');
  });

  it('throws when none of the ids resolve to a known image', async () => {
    const synthesizer = createSynthesizer({
      store: createSessionStore(),
      fetchImage: async () => ({ buffer: Buffer.alloc(0), contentType: 'image/png', bytes: 0 }),
      analyzer,
      extractPalette: async () => [],
    });
    await expect(synthesizer.synthesize(['missing'])).rejects.toBeInstanceOf(SynthesizeError);
  });
});
