import { describe, expect, it } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';
import { ImageSourceError, type ImageSourceProvider } from '../services/image-source.js';

const config = loadConfig({ NODE_ENV: 'test' });

const sample: ImageCandidate[] = [
  {
    id: 'abc',
    source: 'openverse',
    url: 'https://img.example.com/a.jpg',
    rationale: 'openverse result for "anime"',
  },
];

function stubSource(impl: ImageSourceProvider['search']): ImageSourceProvider {
  return { name: 'openverse', search: impl };
}

describe('GET /images/search', () => {
  it('returns candidates from the configured image source and stores them', async () => {
    const app = buildServer({ config, deps: { imageSource: stubSource(async () => sample) } });
    try {
      const response = await app.inject({ method: 'GET', url: '/images/search?q=anime&n=3' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(sample);
    } finally {
      await app.close();
    }
  });

  it('returns 400 when q is missing', async () => {
    const app = buildServer({ config, deps: { imageSource: stubSource(async () => sample) } });
    try {
      const response = await app.inject({ method: 'GET', url: '/images/search' });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('returns 501 when no image source is configured', async () => {
    const app = buildServer({ config: loadConfig({ NODE_ENV: 'test', IMAGE_SOURCE: 'none' }) });
    try {
      const response = await app.inject({ method: 'GET', url: '/images/search?q=anime' });
      expect(response.statusCode).toBe(501);
    } finally {
      await app.close();
    }
  });

  it('returns 502 when the image source fails', async () => {
    const app = buildServer({
      config,
      deps: {
        imageSource: stubSource(async () => {
          throw new ImageSourceError('boom');
        }),
      },
    });
    try {
      const response = await app.inject({ method: 'GET', url: '/images/search?q=anime' });
      expect(response.statusCode).toBe(502);
    } finally {
      await app.close();
    }
  });
});
