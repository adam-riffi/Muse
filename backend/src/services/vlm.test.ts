import { describe, expect, it, vi } from 'vitest';
import { createVlmAnalyzer, VlmAnalysisError, type VlmImage, type VlmProvider } from './vlm.js';

const VALID_JSON = JSON.stringify({
  typography: { style: 'geometric sans', notes: 'tight tracking' },
  spacing: { density: 'airy', notes: 'generous gutters' },
  mood: ['calm', 'editorial'],
  motifs: ['grids', 'duotone'],
  summary: 'A clean editorial moodboard.',
});

const images: VlmImage[] = [{ mediaType: 'image/png', data: 'AAAA' }];

function provider(complete: VlmProvider['complete']): VlmProvider {
  return { name: 'mock', complete };
}

describe('createVlmAnalyzer', () => {
  it('parses a clean JSON object response', async () => {
    const analyzer = createVlmAnalyzer({ provider: provider(async () => VALID_JSON) });
    const analysis = await analyzer.analyze({ images });
    expect(analysis.spacing.density).toBe('airy');
    expect(analysis.mood).toContain('calm');
    expect('palette' in analysis).toBe(false);
  });

  it('extracts JSON from prose and markdown fences', async () => {
    const wrapped = `Sure! Here is the analysis:\n\n\`\`\`json\n${VALID_JSON}\n\`\`\`\nHope it helps.`;
    const analyzer = createVlmAnalyzer({ provider: provider(async () => wrapped) });
    const analysis = await analyzer.analyze({ images });
    expect(analysis.typography.style).toBe('geometric sans');
  });

  it('retries once on unparseable output, then succeeds', async () => {
    const complete = vi
      .fn<VlmProvider['complete']>()
      .mockResolvedValueOnce('I cannot help with that.')
      .mockResolvedValueOnce(VALID_JSON);
    const analyzer = createVlmAnalyzer({ provider: provider(complete) });
    const analysis = await analyzer.analyze({ images });
    expect(analysis.summary).toContain('editorial');
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('throws VlmAnalysisError after a failed retry', async () => {
    const analyzer = createVlmAnalyzer({ provider: provider(async () => 'nope') });
    await expect(analyzer.analyze({ images })).rejects.toBeInstanceOf(VlmAnalysisError);
  });

  it('caches by image set so the provider is called once', async () => {
    const complete = vi.fn<VlmProvider['complete']>().mockResolvedValue(VALID_JSON);
    const analyzer = createVlmAnalyzer({ provider: provider(complete) });
    await analyzer.analyze({ images });
    await analyzer.analyze({ images });
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
