import { describe, expect, it } from 'vitest';
import { DesignTokensSchema, ManifestSchema } from './export.js';

const manifest = {
  generatedAt: '2026-06-27T18:00:00.000Z',
  imageCount: 1,
  images: [
    {
      id: 'abc',
      file: 'images/abc.jpg',
      source: 'codex:websearch',
      url: 'https://example.com/a.jpg',
      rationale: 'fits the brief',
    },
  ],
};

const tokens = {
  palette: [{ hex: '#1a2b3c', role: 'dominant' }],
  typography: { style: 'geometric sans', notes: 'tight tracking' },
  spacing: { density: 'balanced', notes: 'even rhythm' },
};

describe('ManifestSchema', () => {
  it('accepts a valid manifest', () => {
    expect(ManifestSchema.safeParse(manifest).success).toBe(true);
  });

  it('rejects a non-ISO generatedAt', () => {
    expect(ManifestSchema.safeParse({ ...manifest, generatedAt: 'last tuesday' }).success).toBe(
      false,
    );
  });

  it('rejects a negative imageCount', () => {
    expect(ManifestSchema.safeParse({ ...manifest, imageCount: -1 }).success).toBe(false);
  });

  it('rejects an entry with an invalid url', () => {
    expect(
      ManifestSchema.safeParse({
        ...manifest,
        images: [{ ...manifest.images[0], url: 'not-a-url' }],
      }).success,
    ).toBe(false);
  });
});

describe('DesignTokensSchema', () => {
  it('accepts valid design tokens', () => {
    expect(DesignTokensSchema.safeParse(tokens).success).toBe(true);
  });

  it('rejects an invalid palette hex', () => {
    expect(
      DesignTokensSchema.safeParse({ ...tokens, palette: [{ hex: 'teal', role: 'accent' }] })
        .success,
    ).toBe(false);
  });
});
