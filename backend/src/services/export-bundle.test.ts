import { unzipSync, strFromU8 } from 'fflate';
import { describe, expect, it, vi } from 'vitest';
import type { ImageCandidate, MoodboardAnalysis } from '@muse/shared';
import { createExporter, ExportError } from './export-bundle.js';
import { createSessionStore } from './store.js';

const analysis: MoodboardAnalysis = {
  palette: [{ hex: '#112233', role: 'dominant' }],
  typography: { style: 'serif', notes: 'classic' },
  spacing: { density: 'balanced', notes: 'even' },
  mood: ['warm'],
  motifs: ['arches'],
  summary: 'A warm classical board.',
};

function candidate(id: string, url: string): ImageCandidate {
  return { id, source: 'codex:websearch', url, rationale: 'fits' };
}

function fakeFetch() {
  return vi.fn(async (url: string) => ({
    buffer: Buffer.from(`png:${url}`),
    contentType: 'image/png',
    bytes: 8,
  }));
}

describe('createExporter', () => {
  it('produces a zip with images and all rendered artifacts', async () => {
    const store = createSessionStore();
    store.putCandidates([candidate('a', 'https://x.com/a.jpg')]);
    store.setBoard({
      elements: [
        {
          id: 'e',
          type: 'image',
          x: 0,
          y: 0,
          rotation: 0,
          candidateId: 'a',
          width: 100,
          height: 80,
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const exporter = createExporter({
      store,
      fetchImage: fakeFetch(),
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    const zip = await exporter.build({
      imageIds: ['a'],
      analysis,
      boardPng: Buffer.from('PNG').toString('base64'),
    });
    const entries = unzipSync(zip);
    const names = Object.keys(entries).sort();

    expect(names).toEqual(
      [
        'board.json',
        'board.png',
        'design-brief.md',
        'design-tokens.json',
        'images/a.png',
        'manifest.json',
        'prompt.md',
      ].sort(),
    );
    const manifest = JSON.parse(strFromU8(entries['manifest.json']!)) as { imageCount: number };
    expect(manifest.imageCount).toBe(1);
    expect(strFromU8(entries['design-brief.md']!)).toContain('# Design Brief');
    expect(strFromU8(entries['images/a.png']!)).toBe('png:https://x.com/a.jpg');
  });

  it('omits board.png when none is supplied', async () => {
    const store = createSessionStore();
    store.putCandidates([candidate('a', 'https://x.com/a.jpg')]);
    const exporter = createExporter({ store, fetchImage: fakeFetch() });
    const zip = await exporter.build({ imageIds: ['a'], analysis });
    expect(Object.keys(unzipSync(zip))).not.toContain('board.png');
  });

  it('throws when no ids resolve to a known image', async () => {
    const exporter = createExporter({ store: createSessionStore(), fetchImage: fakeFetch() });
    await expect(exporter.build({ imageIds: ['missing'], analysis })).rejects.toBeInstanceOf(
      ExportError,
    );
  });
});
