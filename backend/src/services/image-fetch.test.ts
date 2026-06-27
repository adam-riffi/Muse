import { describe, expect, it } from 'vitest';
import { fetchImage, ImageFetchError } from './image-fetch.js';

function imageResponse(
  body: Uint8Array,
  contentType = 'image/png',
  headers: Record<string, string> = {},
) {
  return new Response(body, { status: 200, headers: { 'content-type': contentType, ...headers } });
}

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('fetchImage', () => {
  it('returns the buffer and content-type for a valid image', async () => {
    const result = await fetchImage('https://x.com/a.png', {
      fetchImpl: () => Promise.resolve(imageResponse(png)),
    });
    expect(result.contentType).toBe('image/png');
    expect(result.bytes).toBe(png.byteLength);
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('normalizes a content-type with charset', async () => {
    const result = await fetchImage('https://x.com/a.png', {
      fetchImpl: () => Promise.resolve(imageResponse(png, 'image/png; charset=binary')),
    });
    expect(result.contentType).toBe('image/png');
  });

  it('rejects a non-image content-type', async () => {
    await expect(
      fetchImage('https://x.com/a.html', {
        fetchImpl: () => Promise.resolve(imageResponse(png, 'text/html')),
      }),
    ).rejects.toBeInstanceOf(ImageFetchError);
  });

  it('rejects a non-ok response', async () => {
    await expect(
      fetchImage('https://x.com/missing.png', {
        fetchImpl: () => Promise.resolve(new Response(null, { status: 404 })),
      }),
    ).rejects.toBeInstanceOf(ImageFetchError);
  });

  it('rejects an oversized image by declared content-length', async () => {
    await expect(
      fetchImage('https://x.com/big.png', {
        maxBytes: 100,
        fetchImpl: () =>
          Promise.resolve(imageResponse(png, 'image/png', { 'content-length': '1000' })),
      }),
    ).rejects.toBeInstanceOf(ImageFetchError);
  });

  it('rejects an oversized image by actual bytes', async () => {
    const big = new Uint8Array(200);
    await expect(
      fetchImage('https://x.com/big.png', {
        maxBytes: 100,
        fetchImpl: () => Promise.resolve(imageResponse(big)),
      }),
    ).rejects.toBeInstanceOf(ImageFetchError);
  });
});
