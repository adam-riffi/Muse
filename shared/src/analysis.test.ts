import { describe, expect, it } from 'vitest';
import { HexColorSchema, MoodboardAnalysisSchema } from './analysis.js';

const valid = {
  palette: [
    { hex: '#1a2b3c', role: 'dominant' },
    { hex: '#ffffff', role: 'background' },
  ],
  typography: { style: 'geometric sans', notes: 'tight tracking, high contrast' },
  spacing: { density: 'airy', notes: 'generous margins' },
  mood: ['calm', 'editorial'],
  motifs: ['grids', 'duotone'],
  summary: 'A calm, editorial aesthetic with airy spacing.',
};

describe('MoodboardAnalysisSchema', () => {
  it('accepts a fully valid analysis', () => {
    expect(MoodboardAnalysisSchema.safeParse(valid).success).toBe(true);
  });

  it('allows empty palette / mood / motifs arrays', () => {
    expect(
      MoodboardAnalysisSchema.safeParse({ ...valid, palette: [], mood: [], motifs: [] }).success,
    ).toBe(true);
  });

  it('rejects an invalid palette role', () => {
    const result = MoodboardAnalysisSchema.safeParse({
      ...valid,
      palette: [{ hex: '#1a2b3c', role: 'primary' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid spacing density', () => {
    const result = MoodboardAnalysisSchema.safeParse({
      ...valid,
      spacing: { density: 'spacious', notes: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing summary', () => {
    const result = MoodboardAnalysisSchema.safeParse({
      palette: valid.palette,
      typography: valid.typography,
      spacing: valid.spacing,
      mood: valid.mood,
      motifs: valid.motifs,
    });
    expect(result.success).toBe(false);
  });
});

describe('HexColorSchema', () => {
  it('accepts 6-digit hex colors', () => {
    expect(HexColorSchema.safeParse('#1a2b3c').success).toBe(true);
    expect(HexColorSchema.safeParse('#FFFFFF').success).toBe(true);
  });

  it('rejects malformed hex colors', () => {
    for (const bad of ['1a2b3c', '#fff', '#12345g', '#1234567', 'red']) {
      expect(HexColorSchema.safeParse(bad).success).toBe(false);
    }
  });
});
