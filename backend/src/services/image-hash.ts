import sharp from 'sharp';

const DEFAULT_THRESHOLD = 5;

// Perceptual average hash (aHash): downscale to 8x8 greyscale and threshold each pixel against the
// mean to produce a 64-bit fingerprint. Visually similar images yield small Hamming distances.
export async function averageHash(image: Buffer): Promise<bigint> {
  const { data, info } = await sharp(image)
    .resize(8, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const pixels: number[] = [];
  for (let i = 0; i < data.length; i += channels) {
    pixels.push(data[i]!);
  }

  const mean = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;

  let hash = 0n;
  for (const value of pixels) {
    hash = (hash << 1n) | (value >= mean ? 1n : 0n);
  }
  return hash;
}

export function hammingDistance(a: bigint, b: bigint): number {
  let diff = a ^ b;
  let count = 0;
  while (diff > 0n) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

export function isPerceptualDuplicate(
  a: bigint,
  b: bigint,
  threshold = DEFAULT_THRESHOLD,
): boolean {
  return hammingDistance(a, b) <= threshold;
}

// Drop visually-duplicate items, keeping the first occurrence. `loadImage` supplies the bytes for
// each item (injectable so the caller controls fetching/caching).
export async function dedupeByImageHash<T extends { id: string }>(
  items: readonly T[],
  loadImage: (item: T) => Promise<Buffer>,
  threshold = DEFAULT_THRESHOLD,
): Promise<T[]> {
  const kept: Array<{ item: T; hash: bigint }> = [];
  for (const item of items) {
    const hash = await averageHash(await loadImage(item));
    const duplicate = kept.some((entry) => isPerceptualDuplicate(entry.hash, hash, threshold));
    if (!duplicate) {
      kept.push({ item, hash });
    }
  }
  return kept.map((entry) => entry.item);
}
