import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { ImageCandidate, MoodboardAnalysis } from '@muse/shared';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';
import { createSessionStore } from '../services/store.js';

const config = loadConfig({ NODE_ENV: 'test' });

const analysis: MoodboardAnalysis = {
  palette: [{ hex: '#112233', role: 'dominant' }],
  typography: { style: 'serif', notes: 'classic' },
  spacing: { density: 'balanced', notes: 'even' },
  mood: ['warm'],
  motifs: ['arches'],
  summary: 'A warm classical board.',
};

const candidate: ImageCandidate = {
  id: 'a',
  source: 'codex:websearch',
  url: 'https://x.com/a.jpg',
  rationale: 'fits',
};

function appWithCandidate() {
  const store = createSessionStore();
  store.putCandidates([candidate]);
  return buildServer({
    config,
    deps: {
      store,
      fetchImage: async () => ({ buffer: Buffer.from('png'), contentType: 'image/png', bytes: 3 }),
    },
  });
}

describe('POST /export', () => {
  it('streams a zip bundle of the kept set', async () => {
    const app = appWithCandidate();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/export',
        payload: { imageIds: ['a'], analysis },
      });
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
      const names = Object.keys(unzipSync(response.rawPayload));
      expect(names).toContain('manifest.json');
      expect(names).toContain('images/a.png');
      expect(names).toContain('design-tokens.json');
      expect(names).toContain('board.json');
    } finally {
      await app.close();
    }
  });

  it('returns 400 for an invalid request body', async () => {
    const app = appWithCandidate();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/export',
        payload: { imageIds: [] },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('returns 400 when no ids resolve to a known image', async () => {
    const app = appWithCandidate();
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/export',
        payload: { imageIds: ['missing'], analysis },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});
