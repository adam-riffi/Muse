import { describe, expect, it } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { buildImageAsset, buildImageShape, candidateAssetId } from './place';

const candidate: ImageCandidate = {
  id: 'cand-1',
  source: 'codex:websearch',
  url: 'https://x.com/a.jpg',
  title: 'A reference',
  rationale: 'fits',
};

describe('candidateAssetId', () => {
  it('derives a tldraw asset id from the candidate id', () => {
    expect(candidateAssetId('cand-1')).toBe('asset:cand-1');
  });
});

describe('buildImageAsset', () => {
  it('builds an image asset record pointing at the thumbnail src', () => {
    const asset = buildImageAsset(candidate, '/api/image/cand-1/thumbnail');
    expect(asset).toMatchObject({
      id: 'asset:cand-1',
      typeName: 'asset',
      type: 'image',
      props: { src: '/api/image/cand-1/thumbnail', mimeType: 'image/webp', name: 'A reference' },
    });
  });
});

describe('buildImageShape', () => {
  it('builds an image shape carrying the candidateId in meta and the assetId in props', () => {
    const shape = buildImageShape(candidate, { x: 10, y: 20 });
    expect(shape).toMatchObject({
      type: 'image',
      x: 10,
      y: 20,
      props: { assetId: 'asset:cand-1' },
      meta: { candidateId: 'cand-1' },
    });
  });
});
