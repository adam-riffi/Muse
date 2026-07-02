import { Vibrant } from 'node-vibrant/node';
import sharp from 'sharp';
import { type PaletteRole, type PaletteSwatch, PaletteSwatchSchema } from '@muse/shared';

// node-vibrant's swatch categories, in the order we surface them.
type Category = 'Vibrant' | 'DarkVibrant' | 'LightVibrant' | 'Muted' | 'DarkMuted' | 'LightMuted';

const CATEGORIES: Category[] = [
  'Vibrant',
  'DarkVibrant',
  'LightVibrant',
  'Muted',
  'DarkMuted',
  'LightMuted',
];

// Each role prefers certain Vibrant categories, falling back in order. Deterministic by design:
// MMCQ quantization is stable for a given input, so the same kept set yields the same palette.
const ROLE_PREFERENCES: Record<PaletteRole, Category[]> = {
  dominant: ['Vibrant', 'DarkVibrant', 'Muted', 'LightVibrant'],
  accent: ['LightVibrant', 'DarkVibrant', 'Vibrant'],
  neutral: ['Muted', 'DarkMuted', 'LightMuted'],
  background: ['LightMuted', 'DarkMuted', 'Muted'],
};

const ROLE_ORDER: PaletteRole[] = ['dominant', 'accent', 'neutral', 'background'];

type Representative = { hex: string; population: number };

function normalizeHex(hex: string): string | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  const group = match?.[1];
  return group === undefined ? null : `#${group.toLowerCase()}`;
}

// Aggregate one image's palette into the running per-category representatives. A category's
// representative is the swatch with the largest population seen so far (ties broken by hex for
// stability).
function accumulate(reps: Map<Category, Representative>, palette: Record<string, unknown>): void {
  for (const category of CATEGORIES) {
    const swatch = palette[category] as { hex?: string; population?: number } | null | undefined;
    if (swatch == null || typeof swatch.hex !== 'string') {
      continue;
    }
    const hex = normalizeHex(swatch.hex);
    if (hex === null) {
      continue;
    }
    const population = typeof swatch.population === 'number' ? swatch.population : 0;
    const current = reps.get(category);
    if (
      current === undefined ||
      population > current.population ||
      (population === current.population && hex < current.hex)
    ) {
      reps.set(category, { hex, population });
    }
  }
}

function assignRoles(reps: Map<Category, Representative>): PaletteSwatch[] {
  const usedCategories = new Set<Category>();
  const usedHexes = new Set<string>();
  const swatches: PaletteSwatch[] = [];

  for (const role of ROLE_ORDER) {
    for (const category of ROLE_PREFERENCES[role]) {
      const rep = reps.get(category);
      if (rep === undefined || usedCategories.has(category) || usedHexes.has(rep.hex)) {
        continue;
      }
      usedCategories.add(category);
      usedHexes.add(rep.hex);
      swatches.push({ hex: rep.hex, role });
      break;
    }
  }

  // Guarantee a dominant role: fall back to the most populous unused representative.
  if (!swatches.some((swatch) => swatch.role === 'dominant')) {
    const fallback = [...reps.values()]
      .filter((rep) => !usedHexes.has(rep.hex))
      .sort((a, b) => b.population - a.population || (a.hex < b.hex ? -1 : 1))[0];
    if (fallback !== undefined) {
      swatches.unshift({ hex: fallback.hex, role: 'dominant' });
    }
  }

  return swatches.map((swatch) => PaletteSwatchSchema.parse(swatch));
}

// Deterministically derive a role-tagged palette from the pixels of the kept images. This is the
// "determinism boundary": colors come from pixels only — never from the VLM. Each image is first
// normalized to PNG via sharp because node-vibrant's decoder (Jimp) can't read WebP/AVIF; a single
// undecodable image is skipped rather than failing the whole palette.
export async function extractPalette(images: readonly Buffer[]): Promise<PaletteSwatch[]> {
  const reps = new Map<Category, Representative>();
  for (const image of images) {
    try {
      const png = await sharp(image).png().toBuffer();
      const palette = await Vibrant.from(png).getPalette();
      accumulate(reps, palette as unknown as Record<string, unknown>);
    } catch {
      // skip images that can't be decoded
    }
  }
  return assignRoles(reps);
}
