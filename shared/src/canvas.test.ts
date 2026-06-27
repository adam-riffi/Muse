import { describe, expect, it } from 'vitest';
import { BoardStateSchema, CanvasElementSchema, keptCandidateIds } from './canvas.js';

const imageEl = (id: string, candidateId: string) => ({
  id,
  type: 'image',
  x: 0,
  y: 0,
  candidateId,
  width: 200,
  height: 150,
});

const style = { stroke: '#ffffff', strokeWidth: 2 };

describe('CanvasElementSchema', () => {
  it('accepts an image element', () => {
    expect(CanvasElementSchema.safeParse(imageEl('e1', 'cand-1')).success).toBe(true);
  });

  it('accepts shape, arrow, freedraw, and text elements', () => {
    const elements = [
      { id: 'r', type: 'rect', x: 0, y: 0, width: 10, height: 10, style },
      { id: 'el', type: 'ellipse', x: 0, y: 0, width: 10, height: 10, style },
      {
        id: 'a',
        type: 'arrow',
        x: 0,
        y: 0,
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
        ],
        style,
      },
      {
        id: 'f',
        type: 'freedraw',
        x: 0,
        y: 0,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        style,
      },
      { id: 't', type: 'text', x: 0, y: 0, text: 'note', fontSize: 16, color: '#fff' },
    ];
    for (const element of elements) {
      expect(CanvasElementSchema.safeParse(element).success).toBe(true);
    }
  });

  it('defaults rotation to 0', () => {
    const parsed = CanvasElementSchema.parse(imageEl('e1', 'cand-1'));
    expect(parsed.rotation).toBe(0);
  });

  it('rejects an unknown element type', () => {
    expect(CanvasElementSchema.safeParse({ id: 'x', type: 'star', x: 0, y: 0 }).success).toBe(
      false,
    );
  });

  it('rejects an arrow with fewer than two points', () => {
    expect(
      CanvasElementSchema.safeParse({
        id: 'a',
        type: 'arrow',
        x: 0,
        y: 0,
        points: [{ x: 0, y: 0 }],
        style,
      }).success,
    ).toBe(false);
  });
});

describe('BoardStateSchema', () => {
  it('accepts a board and defaults the viewport fields', () => {
    const parsed = BoardStateSchema.parse({ elements: [imageEl('e1', 'cand-1')], viewport: {} });
    expect(parsed.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});

describe('keptCandidateIds', () => {
  it('returns candidate ids of image elements in order, de-duplicated', () => {
    const board = BoardStateSchema.parse({
      elements: [
        imageEl('e1', 'cand-1'),
        { id: 'r', type: 'rect', x: 0, y: 0, width: 10, height: 10, style },
        imageEl('e2', 'cand-2'),
        imageEl('e3', 'cand-1'),
      ],
      viewport: {},
    });
    expect(keptCandidateIds(board)).toEqual(['cand-1', 'cand-2']);
  });

  it('returns an empty array for a board with no images', () => {
    const board = BoardStateSchema.parse({ elements: [], viewport: {} });
    expect(keptCandidateIds(board)).toEqual([]);
  });
});
