import { describe, expect, it } from 'vitest';
import { imageId } from './hash.js';

describe('imageId', () => {
  it('is deterministic for the same url', () => {
    expect(imageId('https://example.com/a.jpg')).toBe(imageId('https://example.com/a.jpg'));
  });

  it('differs for different urls', () => {
    expect(imageId('https://example.com/a.jpg')).not.toBe(imageId('https://example.com/b.jpg'));
  });

  it('returns a 64-char sha-256 hex digest', () => {
    expect(imageId('https://example.com/a.jpg')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('matches a known sha-256 value', () => {
    // echo -n "https://example.com/a.jpg" | sha256sum
    expect(imageId('https://example.com/a.jpg')).toBe(
      '276a1ac00ba4f0ea47eeeafca24284f41bc78dc593af1f048615aceba44ab9d9',
    );
  });
});
