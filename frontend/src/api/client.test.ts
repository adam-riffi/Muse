import { describe, expect, it } from 'vitest';
import { discover, propose, searchImages, thumbnailUrl } from './client';

describe('api client', () => {
  it('discover() returns parsed candidates from the backend', async () => {
    const candidates = await discover({ brief: 'cozy y2k bedroom' });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ url: 'https://x.com/a.jpg', source: 'codex:websearch' });
  });

  it('propose() returns a proposition round', async () => {
    const round = await propose({ brief: 'anime' });
    expect(round.id).toBe('round-1');
    expect(round.options.length).toBeGreaterThan(0);
  });

  it('thumbnailUrl() builds the thumbnail endpoint path', () => {
    expect(thumbnailUrl('abc')).toBe('/api/image/abc/thumbnail');
  });

  it('searchImages() returns candidates from the image source', async () => {
    const candidates = await searchImages('anime', 5);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ url: 'https://x.com/a.jpg' });
  });
});
