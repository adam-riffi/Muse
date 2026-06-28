import type { ImageCandidate } from '@muse/shared';

const DEFAULT_SIZE = 320;

// Plain-object builders for the tldraw image asset + shape that represent a kept candidate. Kept
// free of tldraw imports so they are trivially testable; the board store casts + hands them to the
// real editor (createAssets / createShape) at runtime. The candidateId lives in shape.meta — that
// is what the adapter reads back to derive the kept set.
export function candidateAssetId(candidateId: string): string {
  return `asset:${candidateId}`;
}

export type ImageAssetRecord = {
  id: string;
  typeName: 'asset';
  type: 'image';
  props: { name: string; src: string; w: number; h: number; mimeType: string; isAnimated: boolean };
  meta: Record<string, unknown>;
};

export function buildImageAsset(candidate: ImageCandidate, src: string): ImageAssetRecord {
  return {
    id: candidateAssetId(candidate.id),
    typeName: 'asset',
    type: 'image',
    props: {
      name: candidate.title ?? candidate.id,
      src,
      w: DEFAULT_SIZE,
      h: DEFAULT_SIZE,
      mimeType: 'image/webp',
      isAnimated: false,
    },
    meta: {},
  };
}

export type ImageShapePartial = {
  type: 'image';
  x: number;
  y: number;
  props: { assetId: string; w: number; h: number };
  meta: { candidateId: string };
};

export function buildImageShape(
  candidate: ImageCandidate,
  point: { x: number; y: number },
): ImageShapePartial {
  return {
    type: 'image',
    x: point.x,
    y: point.y,
    props: { assetId: candidateAssetId(candidate.id), w: DEFAULT_SIZE, h: DEFAULT_SIZE },
    meta: { candidateId: candidate.id },
  };
}
