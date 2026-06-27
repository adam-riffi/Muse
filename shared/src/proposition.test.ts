import { describe, expect, it } from 'vitest';
import { PropositionOptionSchema, PropositionRoundSchema } from './proposition.js';

const option = {
  id: 'ghibli',
  label: 'Ghibli',
  descriptor: 'soft painterly anime, lush hand-drawn backgrounds',
  query: 'studio ghibli landscape painting',
};

const optionWithPreview = {
  ...option,
  preview: {
    id: 'p1',
    source: 'codex:websearch',
    url: 'https://x.com/ghibli.jpg',
    rationale: 'representative ghibli still',
  },
};

describe('PropositionOptionSchema', () => {
  it('accepts an option without a preview', () => {
    expect(PropositionOptionSchema.safeParse(option).success).toBe(true);
  });

  it('accepts an option with a valid preview candidate', () => {
    expect(PropositionOptionSchema.safeParse(optionWithPreview).success).toBe(true);
  });

  it('rejects a missing descriptor', () => {
    expect(PropositionOptionSchema.safeParse({ id: 'x', label: 'X', query: 'q' }).success).toBe(
      false,
    );
  });

  it('rejects a preview with an invalid url', () => {
    expect(
      PropositionOptionSchema.safeParse({
        ...option,
        preview: { id: 'p', source: 'codex:websearch', url: 'not-a-url', rationale: 'r' },
      }).success,
    ).toBe(false);
  });
});

describe('PropositionRoundSchema', () => {
  it('accepts a valid round', () => {
    const round = {
      id: 'round-1',
      brief: 'anime',
      refinements: [],
      options: [option, optionWithPreview],
    };
    expect(PropositionRoundSchema.safeParse(round).success).toBe(true);
  });

  it('rejects a round missing options', () => {
    expect(
      PropositionRoundSchema.safeParse({ id: 'r', brief: 'anime', refinements: [] }).success,
    ).toBe(false);
  });
});
