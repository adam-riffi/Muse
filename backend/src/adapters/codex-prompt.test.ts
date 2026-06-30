import { describe, expect, it } from 'vitest';
import { buildDiscoveryPrompt, buildStrictRetryReminder } from './codex-prompt.js';

describe('buildDiscoveryPrompt', () => {
  it('embeds the brief text', () => {
    const prompt = buildDiscoveryPrompt({ brief: 'cozy y2k bedroom' });
    expect(prompt).toContain('cozy y2k bedroom');
  });

  it('requests JSON-only output with the exact fields', () => {
    const prompt = buildDiscoveryPrompt({ brief: 'x' });
    expect(prompt).toContain('Return ONLY a JSON array');
    for (const field of ['"url"', '"pageUrl"', '"title"', '"rationale"']) {
      expect(prompt).toContain(field);
    }
    expect(prompt).toContain('No prose');
  });

  it('uses the default count and respects an override', () => {
    expect(buildDiscoveryPrompt({ brief: 'x' })).toContain('find 8 ');
    expect(buildDiscoveryPrompt({ brief: 'x', count: 5 })).toContain('find 5 ');
  });

  it('includes refinements when provided', () => {
    const prompt = buildDiscoveryPrompt({ brief: 'anime', refinements: ['ghibli', 'retro'] });
    expect(prompt).toContain('ghibli; retro');
  });

  it('omits the refinement block when none are given', () => {
    expect(buildDiscoveryPrompt({ brief: 'anime' })).not.toContain('Refined style direction');
  });

  it('anchors the brief as the fixed subject so refinements cannot pull it off-direction', () => {
    const prompt = buildDiscoveryPrompt({ brief: 'death note terminal', refinements: ['neon'] });
    expect(prompt).toContain('never drift');
    expect(prompt).toContain('unmistakably read as "death note terminal"');
    expect(prompt).toContain('they never replace the subject');
  });
});

describe('buildStrictRetryReminder', () => {
  it('reiterates the strict JSON-only contract', () => {
    const reminder = buildStrictRetryReminder();
    expect(reminder).toContain('JSON array');
    expect(reminder).toContain('No prose');
  });
});
