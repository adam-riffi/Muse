import { mkdirSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const DEFAULT_SIZE = 320;

export async function makeThumbnail(image: Buffer, size = DEFAULT_SIZE): Promise<Buffer> {
  return sharp(image)
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

export type ThumbnailStore = {
  has(id: string): Promise<boolean>;
  get(id: string): Promise<Buffer | null>;
  put(id: string, thumbnail: Buffer): Promise<void>;
};

// Disk-backed thumbnail cache keyed by candidate id (temp dir by default; cleared between runs).
// Synchronous factory (mkdirSync) so a synchronous server factory can create it inline.
export function createThumbnailStore(baseDir?: string): ThumbnailStore {
  const dir = baseDir ?? join(tmpdir(), 'muse-thumbnails');
  mkdirSync(dir, { recursive: true });

  const pathFor = (id: string): string => join(dir, `${sanitizeId(id)}.webp`);

  return {
    async has(id) {
      try {
        await stat(pathFor(id));
        return true;
      } catch {
        return false;
      }
    },
    async get(id) {
      try {
        return await readFile(pathFor(id));
      } catch {
        return null;
      }
    },
    async put(id, thumbnail) {
      await writeFile(pathFor(id), thumbnail);
    },
  };
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}
