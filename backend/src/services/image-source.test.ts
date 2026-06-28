import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../config.js';
import {
  ImageSourceError,
  createImageSource,
  createOpenverseSource,
  createUnsplashSource,
} from './image-source.js';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('createOpenverseSource', () => {
  it('maps Openverse results to ImageCandidate[]', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            url: 'https://img.example.com/a.jpg',
            foreign_landing_url: 'https://page.example.com/a',
            title: 'Sunset',
          },
          { url: 'https://img.example.com/b.jpg' },
          { url: 'not-a-url' },
        ],
      }),
    );
    const source = createOpenverseSource({ fetchImpl });
    const candidates = await source.search('anime', 5);

    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({
      source: 'openverse',
      url: 'https://img.example.com/a.jpg',
      pageUrl: 'https://page.example.com/a',
      title: 'Sunset',
    });
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringContaining('q=anime'), expect.anything());
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('page_size=5'),
      expect.anything(),
    );
  });

  it('throws ImageSourceError on a non-ok response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false, 503));
    const source = createOpenverseSource({ fetchImpl });
    await expect(source.search('x', 3)).rejects.toBeInstanceOf(ImageSourceError);
  });

  it('clamps the page size to the supported range', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    await createOpenverseSource({ fetchImpl }).search('x', 999);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('page_size=24'),
      expect.anything(),
    );
  });
});

describe('createUnsplashSource', () => {
  it('maps Unsplash results and sends the Client-ID header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            urls: { regular: 'https://img.unsplash.com/x.jpg' },
            links: { html: 'https://unsplash.com/photos/x' },
            description: 'A photo',
          },
        ],
      }),
    );
    const source = createUnsplashSource('key-123', { fetchImpl });
    const candidates = await source.search('retro', 4);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      source: 'unsplash',
      url: 'https://img.unsplash.com/x.jpg',
      pageUrl: 'https://unsplash.com/photos/x',
      title: 'A photo',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Client-ID key-123' }),
      }),
    );
  });
});

describe('createImageSource', () => {
  it('returns an Openverse provider by default', () => {
    const source = createImageSource(loadConfig({ NODE_ENV: 'test' }));
    expect(source?.name).toBe('openverse');
  });

  it('returns null when disabled', () => {
    expect(createImageSource(loadConfig({ NODE_ENV: 'test', IMAGE_SOURCE: 'none' }))).toBeNull();
  });

  it('returns null for unsplash without a key, a provider with one', () => {
    expect(
      createImageSource(loadConfig({ NODE_ENV: 'test', IMAGE_SOURCE: 'unsplash' })),
    ).toBeNull();
    const source = createImageSource(
      loadConfig({ NODE_ENV: 'test', IMAGE_SOURCE: 'unsplash', UNSPLASH_ACCESS_KEY: 'k' }),
    );
    expect(source?.name).toBe('unsplash');
  });
});
