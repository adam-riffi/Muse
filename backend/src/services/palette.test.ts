import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { PaletteSwatchSchema } from '@muse/shared';
import { extractPalette } from './palette.js';

function solid(r: number, g: number, b: number, width = 64, height = 64): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();
}

async function blueWithRedAccent(): Promise<Buffer> {
  const accent = await sharp({
    create: { width: 12, height: 64, channels: 3, background: { r: 220, g: 30, b: 30 } },
  })
    .png()
    .toBuffer();
  return sharp({
    create: { width: 64, height: 64, channels: 3, background: { r: 20, g: 40, b: 200 } },
  })
    .composite([{ input: accent, left: 52, top: 0 }])
    .png()
    .toBuffer();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

describe('extractPalette', () => {
  it('returns an empty palette for no images', async () => {
    expect(await extractPalette([])).toEqual([]);
  });

  it('produces valid, role-tagged, deterministic swatches', async () => {
    const images = [await blueWithRedAccent()];
    const first = await extractPalette(images);
    const second = await extractPalette(images);

    expect(first.length).toBeGreaterThan(0);
    for (const swatch of first) {
      expect(() => PaletteSwatchSchema.parse(swatch)).not.toThrow();
      expect(swatch.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
    // Roles are unique; a dominant is always present.
    expect(new Set(first.map((s) => s.role)).size).toBe(first.length);
    expect(first.some((s) => s.role === 'dominant')).toBe(true);
    // Deterministic: identical input yields identical output.
    expect(second).toEqual(first);
  });

  it('reflects the dominant input color', async () => {
    const palette = await extractPalette([await solid(20, 40, 200)]);
    const dominant = palette.find((s) => s.role === 'dominant');
    expect(dominant).toBeDefined();
    const { r, g, b } = hexToRgb(dominant!.hex);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it('handles WebP images (node-vibrant cannot decode WebP directly)', async () => {
    const webp = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 30, g: 160, b: 90 } },
    })
      .webp()
      .toBuffer();
    const palette = await extractPalette([webp]);
    expect(palette.length).toBeGreaterThan(0);
  });

  it('skips an undecodable buffer instead of throwing', async () => {
    expect(await extractPalette([Buffer.from('not an image')])).toEqual([]);
  });
});
