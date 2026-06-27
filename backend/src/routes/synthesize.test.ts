import { describe, expect, it } from 'vitest';
import type { MoodboardAnalysis } from '@muse/shared';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';
import { SynthesizeError } from '../services/synthesize.js';
import { VlmAnalysisError } from '../services/vlm.js';

const config = loadConfig({ NODE_ENV: 'test' });

const analysis: MoodboardAnalysis = {
  palette: [{ hex: '#112233', role: 'dominant' }],
  typography: { style: 'serif', notes: 'classic' },
  spacing: { density: 'balanced', notes: 'even' },
  mood: ['warm'],
  motifs: ['arches'],
  summary: 'A warm classical board.',
};

describe('POST /synthesize', () => {
  it('returns a MoodboardAnalysis for the kept ids', async () => {
    const app = buildServer({ config, deps: { synthesize: async () => analysis } });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/synthesize',
        payload: { imageIds: ['a', 'b'] },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(analysis);
    } finally {
      await app.close();
    }
  });

  it('returns 400 when imageIds is empty', async () => {
    const app = buildServer({ config, deps: { synthesize: async () => analysis } });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/synthesize',
        payload: { imageIds: [] },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('returns 501 when no VLM provider is configured', async () => {
    const app = buildServer({ config: loadConfig({ NODE_ENV: 'test', VLM_PROVIDER: 'none' }) });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/synthesize',
        payload: { imageIds: ['a'] },
      });
      expect(response.statusCode).toBe(501);
    } finally {
      await app.close();
    }
  });

  it('maps a SynthesizeError to 400 and a VlmAnalysisError to 502', async () => {
    const badIds = buildServer({
      config,
      deps: {
        synthesize: async () => {
          throw new SynthesizeError('no images');
        },
      },
    });
    const badVlm = buildServer({
      config,
      deps: {
        synthesize: async () => {
          throw new VlmAnalysisError('bad output', 'raw');
        },
      },
    });
    try {
      const a = await badIds.inject({
        method: 'POST',
        url: '/synthesize',
        payload: { imageIds: ['a'] },
      });
      const b = await badVlm.inject({
        method: 'POST',
        url: '/synthesize',
        payload: { imageIds: ['a'] },
      });
      expect(a.statusCode).toBe(400);
      expect(b.statusCode).toBe(502);
    } finally {
      await badIds.close();
      await badVlm.close();
    }
  });
});
