import { describe, expect, it } from 'vitest';
import { buildPropositionPrompt, buildPropositionRetryReminder } from './proposition-prompt.js';

describe('buildPropositionPrompt', () => {
  it('embeds the brief and requests distinct sub-styles', () => {
    const prompt = buildPropositionPrompt({ brief: 'anime aesthetic' });
    expect(prompt).toContain('anime aesthetic');
    expect(prompt).toContain('DISTINCT sub-styles');
  });

  it('requests JSON-only output with the exact fields', () => {
    const prompt = buildPropositionPrompt({ brief: 'x' });
    expect(prompt).toContain('Return ONLY a JSON array');
    for (const field of ['"label"', '"descriptor"', '"query"', '"previewUrl"']) {
      expect(prompt).toContain(field);
    }
    expect(prompt).toContain('No prose');
  });

  it('uses the default count and respects an override', () => {
    expect(buildPropositionPrompt({ brief: 'x' })).toContain('Propose 4 ');
    expect(buildPropositionPrompt({ brief: 'x', count: 6 })).toContain('Propose 6 ');
  });

  it('includes prior refinements', () => {
    const prompt = buildPropositionPrompt({ brief: 'anime', refinements: ['retro', 'muted'] });
    expect(prompt).toContain('retro; muted');
  });

  it('omits the refinement block when none are given', () => {
    expect(buildPropositionPrompt({ brief: 'anime' })).not.toContain('Already-chosen direction');
  });
});

describe('buildPropositionRetryReminder', () => {
  it('reiterates the strict JSON contract', () => {
    expect(buildPropositionRetryReminder()).toContain('JSON array');
  });
});
