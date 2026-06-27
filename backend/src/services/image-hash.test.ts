import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  averageHash,
  dedupeByImageHash,
  hammingDistance,
  isPerceptualDuplicate,
} from './image-hash.js';

const SIZE = 16;

// Build a half-dark / half-light image (aHash is degenerate on flat colors, so we need structure).
function splitImage(orientation: 'vertical' | 'horizontal', invert = false): Promise<Buffer> {
  const channels = 3;
  const raw = Buffer.alloc(SIZE * SIZE * channels);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const firstHalf = orientation === 'vertical' ? x < SIZE / 2 : y < SIZE / 2;
      const dark = invert ? !firstHalf : firstHalf;
      const value = dark ? 0 : 255;
      const idx = (y * SIZE + x) * channels;
      raw[idx] = value;
      raw[idx + 1] = value;
      raw[idx + 2] = value;
    }
  }
  return sharp(raw, { raw: { width: SIZE, height: SIZE, channels } })
    .png()
    .toBuffer();
}

describe('hammingDistance', () => {
  it('counts differing bits', () => {
    expect(hammingDistance(0b1011n, 0b1001n)).toBe(1);
    expect(hammingDistance(0n, 0b1111n)).toBe(4);
    expect(hammingDistance(42n, 42n)).toBe(0);
  });
});

describe('averageHash', () => {
  it('is deterministic for the same image', async () => {
    const image = await splitImage('vertical');
    expect(await averageHash(image)).toBe(await averageHash(image));
  });

  it('produces a small distance for similar images and a large one for different images', async () => {
    const a = await averageHash(await splitImage('vertical'));
    const aCopy = await averageHash(await splitImage('vertical'));
    const inverse = await averageHash(await splitImage('vertical', true));

    expect(hammingDistance(a, aCopy)).toBe(0);
    expect(hammingDistance(a, inverse)).toBeGreaterThan(5);
  });
});

describe('isPerceptualDuplicate', () => {
  it('treats identical images as duplicates and inverses as distinct', async () => {
    const a = await averageHash(await splitImage('vertical'));
    const aCopy = await averageHash(await splitImage('vertical'));
    const inverse = await averageHash(await splitImage('vertical', true));

    expect(isPerceptualDuplicate(a, aCopy)).toBe(true);
    expect(isPerceptualDuplicate(a, inverse)).toBe(false);
  });
});

describe('dedupeByImageHash', () => {
  it('drops perceptual duplicates, keeping the first occurrence', async () => {
    const images: Record<string, Buffer> = {
      a: await splitImage('vertical'),
      b: await splitImage('vertical'), // duplicate of a
      c: await splitImage('vertical', true), // distinct
    };
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

    const kept = await dedupeByImageHash(items, (item) => Promise.resolve(images[item.id]!));
    expect(kept.map((item) => item.id)).toEqual(['a', 'c']);
  });
});
