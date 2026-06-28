import { describe, expect, it } from 'vitest';
import { DiscoverInputSchema } from './discover.js';

describe('DiscoverInputSchema', () => {
  it('accepts a brief on its own', () => {
    expect(DiscoverInputSchema.safeParse({ brief: 'cozy y2k bedroom' }).success).toBe(true);
  });

  it('accepts an optional count and refinements', () => {
    const result = DiscoverInputSchema.safeParse({
      brief: 'anime',
      count: 8,
      refinements: ['ghibli', 'retro'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty brief', () => {
    expect(DiscoverInputSchema.safeParse({ brief: '' }).success).toBe(false);
  });

  it('rejects a non-positive or oversized count', () => {
    expect(DiscoverInputSchema.safeParse({ brief: 'x', count: 0 }).success).toBe(false);
    expect(DiscoverInputSchema.safeParse({ brief: 'x', count: 999 }).success).toBe(false);
  });
});
