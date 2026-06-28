import { describe, expect, it } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { CodexDiscoveryError, type DiscoverImagesInput } from '../adapters/codex.js';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';
import { createSessionStore } from '../services/store.js';

const config = loadConfig({ NODE_ENV: 'test' });

const sample: ImageCandidate[] = [
  { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits' },
];

describe('POST /discover', () => {
  it('returns discovered candidates and stores them', async () => {
    const store = createSessionStore();
    const app = buildServer({ config, deps: { discover: () => Promise.resolve(sample), store } });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/discover',
        payload: { brief: 'cozy y2k bedroom' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(sample);
      expect(store.getCandidate('a')?.url).toBe('https://x.com/a.jpg');
    } finally {
      await app.close();
    }
  });

  it('forwards brief, count, and refinements to the adapter', async () => {
    let received: DiscoverImagesInput | undefined;
    const app = buildServer({
      config,
      deps: {
        discover: (input) => {
          received = input;
          return Promise.resolve([]);
        },
      },
    });
    try {
      await app.inject({
        method: 'POST',
        url: '/discover',
        payload: { brief: 'anime', count: 5, refinements: ['ghibli'] },
      });
      expect(received).toMatchObject({ brief: 'anime', count: 5, refinements: ['ghibli'] });
    } finally {
      await app.close();
    }
  });

  it('rejects an empty brief with 400', async () => {
    const app = buildServer({ config, deps: { discover: () => Promise.resolve(sample) } });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/discover',
        payload: { brief: '' },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('maps CodexDiscoveryError to 502 with the raw output', async () => {
    const app = buildServer({
      config,
      deps: {
        discover: () => Promise.reject(new CodexDiscoveryError('boom', 'RAW OUTPUT')),
      },
    });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/discover',
        payload: { brief: 'x' },
      });
      expect(response.statusCode).toBe(502);
      expect(response.json()).toMatchObject({ error: 'Discovery Failed', raw: 'RAW OUTPUT' });
    } finally {
      await app.close();
    }
  });
});
