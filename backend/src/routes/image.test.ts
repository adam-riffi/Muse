import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';
import type { FetchedImage } from '../services/image-fetch.js';
import { createSessionStore } from '../services/store.js';
import { createThumbnailStore } from '../services/thumbnails.js';

const config = loadConfig({ NODE_ENV: 'test' });

function candidate(id: string, url: string): ImageCandidate {
  return { id, source: 'codex:websearch', url, rationale: 'r' };
}

function pngImage(): Promise<Buffer> {
  return sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
}

describe('GET /image/:id/thumbnail', () => {
  it('fetches, thumbnails, and serves webp, then caches', async () => {
    const store = createSessionStore();
    store.putCandidates([candidate('abc', 'https://x.com/a.png')]);
    const image = await pngImage();
    let fetchCount = 0;
    const fetchImage = (): Promise<FetchedImage> => {
      fetchCount += 1;
      return Promise.resolve({ buffer: image, contentType: 'image/png', bytes: image.byteLength });
    };
    const thumbnails = createThumbnailStore(await mkdtemp(join(tmpdir(), 'muse-thumb-route-')));
    const app = buildServer({ config, deps: { store, thumbnails, fetchImage } });

    try {
      const response = await app.inject({ method: 'GET', url: '/image/abc/thumbnail' });
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/webp');
      const meta = await sharp(response.rawPayload).metadata();
      expect(meta.format).toBe('webp');

      await app.inject({ method: 'GET', url: '/image/abc/thumbnail' });
      expect(fetchCount).toBe(1); // second request served from cache
    } finally {
      await app.close();
    }
  });

  it('returns 404 for an unknown candidate', async () => {
    const app = buildServer({ config, deps: { store: createSessionStore() } });
    try {
      const response = await app.inject({ method: 'GET', url: '/image/nope/thumbnail' });
      expect(response.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('returns 502 when the image cannot be fetched', async () => {
    const store = createSessionStore();
    store.putCandidates([candidate('bad', 'https://x.com/bad.png')]);
    const app = buildServer({
      config,
      deps: { store, fetchImage: () => Promise.reject(new Error('boom')) },
    });
    try {
      const response = await app.inject({ method: 'GET', url: '/image/bad/thumbnail' });
      expect(response.statusCode).toBe(502);
    } finally {
      await app.close();
    }
  });
});
