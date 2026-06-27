import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { createThumbnailStore, makeThumbnail } from './thumbnails.js';

async function makeImage(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 120, g: 80, b: 200 } } })
    .png()
    .toBuffer();
}

describe('makeThumbnail', () => {
  it('downscales to fit the box and encodes webp', async () => {
    const thumb = await makeThumbnail(await makeImage(800, 600), 320);
    const meta = await sharp(thumb).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeLessThanOrEqual(320);
    expect(meta.height).toBeLessThanOrEqual(320);
    expect(meta.width).toBe(320);
  });

  it('does not enlarge smaller images', async () => {
    const thumb = await makeThumbnail(await makeImage(100, 100), 320);
    const meta = await sharp(thumb).metadata();
    expect(meta.width).toBe(100);
  });
});

describe('createThumbnailStore', () => {
  const dirs: string[] = [];
  afterEach(() => {
    dirs.length = 0;
  });

  async function tempStore() {
    const dir = await mkdtemp(join(tmpdir(), 'muse-thumb-test-'));
    dirs.push(dir);
    return createThumbnailStore(dir);
  }
  it('round-trips a thumbnail by id', async () => {
    const store = await tempStore();
    const thumb = await makeThumbnail(await makeImage(400, 400));
    expect(await store.has('abc')).toBe(false);
    await store.put('abc', thumb);
    expect(await store.has('abc')).toBe(true);
    expect(await store.get('abc')).toEqual(thumb);
  });

  it('returns null for a missing id', async () => {
    const store = await tempStore();
    expect(await store.get('missing')).toBeNull();
  });
});
