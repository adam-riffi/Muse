import { describe, expect, it } from 'vitest';
import { DesignTokensSchema, type ImageCandidate, type MoodboardAnalysis } from '@muse/shared';
import {
  type ManifestImageInput,
  renderDesignBrief,
  renderDesignTokens,
  renderManifest,
  renderPrompt,
} from './index.js';

const analysis: MoodboardAnalysis = {
  palette: [
    { hex: '#112233', role: 'dominant' },
    { hex: '#ffcc00', role: 'accent' },
  ],
  typography: { style: 'geometric sans', notes: 'tight tracking' },
  spacing: { density: 'airy', notes: 'generous gutters' },
  mood: ['calm', 'editorial'],
  motifs: ['grids'],
  summary: 'A clean editorial moodboard.',
};

const candidate: ImageCandidate = {
  id: 'img-1',
  source: 'openverse',
  url: 'https://img.example.com/a.jpg',
  pageUrl: 'https://page.example.com/a',
  title: 'Sunset',
  rationale: 'sets the mood',
};

const images: ManifestImageInput[] = [{ candidate, file: 'images/img-1.jpg' }];

describe('renderDesignTokens', () => {
  it('projects the analysis onto a valid DesignTokens object', () => {
    const tokens = renderDesignTokens(analysis);
    expect(() => DesignTokensSchema.parse(tokens)).not.toThrow();
    expect(tokens).toEqual({
      palette: analysis.palette,
      typography: analysis.typography,
      spacing: analysis.spacing,
    });
    expect('mood' in tokens).toBe(false);
  });
});

describe('renderManifest', () => {
  it('indexes kept images with provenance and bundle filenames', () => {
    const manifest = renderManifest(images, '2026-01-01T00:00:00.000Z');
    expect(manifest.imageCount).toBe(1);
    expect(manifest.generatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(manifest.images[0]).toEqual({
      id: 'img-1',
      file: 'images/img-1.jpg',
      source: 'openverse',
      url: 'https://img.example.com/a.jpg',
      pageUrl: 'https://page.example.com/a',
      title: 'Sunset',
      rationale: 'sets the mood',
    });
  });
});

describe('renderDesignBrief', () => {
  it('renders deterministic Markdown with palette, sections, and references', () => {
    const brief = renderDesignBrief(analysis, images);
    expect(brief).toContain('# Design Brief');
    expect(brief).toContain('A clean editorial moodboard.');
    expect(brief).toContain('| dominant | `#112233` |');
    expect(brief).toContain('## Typography');
    expect(brief).toContain('- **Density:** airy');
    expect(brief).toContain('- calm');
    expect(brief).toContain('[Sunset](https://page.example.com/a) — sets the mood');
    expect(renderDesignBrief(analysis, images)).toBe(brief);
  });

  it('handles an empty kept set and empty mood/motifs', () => {
    const brief = renderDesignBrief({ ...analysis, mood: [], motifs: [] }, []);
    expect(brief).toContain('## References\n\n- (none)');
    expect(brief).toContain('## Mood\n\n- (none)');
  });
});

describe('renderPrompt', () => {
  it('renders an agent-ready prompt referencing the palette and intent', () => {
    const prompt = renderPrompt(analysis);
    expect(prompt).toContain('A clean editorial moodboard.');
    expect(prompt).toContain('- dominant: #112233');
    expect(prompt).toContain('geometric sans — tight tracking');
    expect(prompt).toContain('calm, editorial');
    expect(renderPrompt(analysis)).toBe(prompt);
  });
});
