import { describe, expect, it } from 'vitest';
import { cameraToViewport, mapTldrawShape } from './adapter';

describe('mapTldrawShape', () => {
  it('maps an image shape (with our candidateId meta) to an image element', () => {
    const element = mapTldrawShape({
      id: 'shape:1',
      type: 'image',
      x: 10,
      y: 20,
      props: { w: 200, h: 150 },
      meta: { candidateId: 'cand-1' },
    });
    expect(element).toEqual({
      id: 'shape:1',
      type: 'image',
      x: 10,
      y: 20,
      rotation: 0,
      candidateId: 'cand-1',
      width: 200,
      height: 150,
    });
  });

  it('maps geo rectangle and ellipse shapes', () => {
    const rect = mapTldrawShape({
      id: 'r',
      type: 'geo',
      x: 0,
      y: 0,
      props: { geo: 'rectangle', w: 5, h: 6 },
    });
    const ellipse = mapTldrawShape({
      id: 'e',
      type: 'geo',
      x: 0,
      y: 0,
      props: { geo: 'ellipse', w: 5, h: 6 },
    });
    expect(rect?.type).toBe('rect');
    expect(ellipse?.type).toBe('ellipse');
  });

  it('maps a text shape, reading the text content', () => {
    const element = mapTldrawShape({
      id: 't',
      type: 'text',
      x: 1,
      y: 2,
      props: { text: 'a note' },
    });
    expect(element).toMatchObject({ type: 'text', text: 'a note' });
  });

  it('maps an arrow shape to a two-point arrow', () => {
    const element = mapTldrawShape({
      id: 'a',
      type: 'arrow',
      x: 0,
      y: 0,
      props: { start: { x: 0, y: 0 }, end: { x: 10, y: 5 } },
    });
    expect(element).toMatchObject({
      type: 'arrow',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 5 },
      ],
    });
  });

  it('maps a draw shape, flattening segment points', () => {
    const element = mapTldrawShape({
      id: 'd',
      type: 'draw',
      x: 0,
      y: 0,
      props: {
        segments: [
          {
            points: [
              { x: 0, y: 0 },
              { x: 1, y: 1 },
              { x: 2, y: 2 },
            ],
          },
        ],
      },
    });
    expect(element?.type).toBe('freedraw');
  });

  it('returns null for an image without a candidateId', () => {
    expect(
      mapTldrawShape({ id: 'i', type: 'image', x: 0, y: 0, props: { w: 1, h: 1 } }),
    ).toBeNull();
  });

  it('returns null for shapes we do not model structurally', () => {
    for (const type of ['note', 'frame', 'line']) {
      expect(mapTldrawShape({ id: type, type, x: 0, y: 0 })).toBeNull();
    }
  });
});

describe('cameraToViewport', () => {
  it('maps the tldraw camera (x,y,z) to a viewport (x,y,zoom)', () => {
    expect(cameraToViewport({ x: 12, y: -4, z: 2 })).toEqual({ x: 12, y: -4, zoom: 2 });
  });
});
