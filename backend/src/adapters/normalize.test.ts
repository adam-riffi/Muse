import { describe, expect, it } from 'vitest';
import { imageId } from '@muse/shared/hash';
import { normalizeDiscoveryItems } from './normalize.js';

describe('normalizeDiscoveryItems', () => {
  it('maps raw items to ImageCandidates with id and source', () => {
    const json = JSON.stringify([
      { url: 'https://a.com/1.jpg', pageUrl: 'https://a.com/p', title: 'One', rationale: 'fits' },
      { url: 'https://b.com/2.png', rationale: 'also fits' },
    ]);
    const candidates = normalizeDiscoveryItems(json);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toEqual({
      id: imageId('https://a.com/1.jpg'),
      source: 'codex:websearch',
      url: 'https://a.com/1.jpg',
      pageUrl: 'https://a.com/p',
      title: 'One',
      rationale: 'fits',
    });
    expect(candidates[1]).toMatchObject({ url: 'https://b.com/2.png', rationale: 'also fits' });
    expect(candidates[1]).not.toHaveProperty('pageUrl');
  });

  it('defaults a missing rationale to an empty string', () => {
    const candidates = normalizeDiscoveryItems('[{"url":"https://a.com/1.jpg"}]');
    expect(candidates[0]?.rationale).toBe('');
  });

  it('drops individually invalid items but keeps valid ones', () => {
    const json = JSON.stringify([
      { url: 'not-a-url', rationale: 'bad' },
      { url: 'https://a.com/ok.jpg', rationale: 'good' },
      { title: 'no url', rationale: 'missing url' },
    ]);
    const candidates = normalizeDiscoveryItems(json);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.url).toBe('https://a.com/ok.jpg');
  });

  it('de-duplicates identical urls', () => {
    const json = JSON.stringify([
      { url: 'https://a.com/1.jpg', rationale: 'first' },
      { url: 'https://a.com/1.jpg', rationale: 'dup' },
    ]);
    expect(normalizeDiscoveryItems(json)).toHaveLength(1);
  });

  it('throws on a non-array payload', () => {
    expect(() => normalizeDiscoveryItems('{"url":"https://a.com/1.jpg"}')).toThrow();
  });

  it('throws on invalid JSON', () => {
    expect(() => normalizeDiscoveryItems('not json at all')).toThrow();
  });
});
