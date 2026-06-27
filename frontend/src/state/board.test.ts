import { beforeEach, describe, expect, it } from 'vitest';
import type { TldrawShapeLike } from '../board/adapter';
import { type BoardEditor, useBoardStore } from './board';

beforeEach(() => {
  useBoardStore.getState().setEditor(null);
});

const fakeEditor = (shapes: TldrawShapeLike[]): BoardEditor => ({
  getCurrentPageShapes: () => shapes,
  getCamera: () => ({ x: 0, y: 0, z: 1 }),
});

describe('useBoardStore', () => {
  it('returns an empty board when no editor is mounted', () => {
    const board = useBoardStore.getState().getBoardState();
    expect(board.elements).toEqual([]);
    expect(useBoardStore.getState().getKeptCandidateIds()).toEqual([]);
  });

  it('derives BoardState from editor shapes, skipping unmapped ones', () => {
    useBoardStore.getState().setEditor(
      fakeEditor([
        {
          id: 's1',
          type: 'image',
          x: 0,
          y: 0,
          props: { w: 10, h: 10 },
          meta: { candidateId: 'cand-1' },
        },
        { id: 's2', type: 'geo', x: 0, y: 0, props: { geo: 'rectangle', w: 5, h: 5 } },
        { id: 's3', type: 'arrow', x: 0, y: 0 },
      ]),
    );
    const board = useBoardStore.getState().getBoardState();
    expect(board.elements.map((element) => element.type)).toEqual(['image', 'rect']);
  });

  it('derives the kept candidate ids from image elements', () => {
    useBoardStore.getState().setEditor(
      fakeEditor([
        {
          id: 's1',
          type: 'image',
          x: 0,
          y: 0,
          props: { w: 10, h: 10 },
          meta: { candidateId: 'cand-1' },
        },
        {
          id: 's2',
          type: 'image',
          x: 0,
          y: 0,
          props: { w: 10, h: 10 },
          meta: { candidateId: 'cand-2' },
        },
      ]),
    );
    expect(useBoardStore.getState().getKeptCandidateIds()).toEqual(['cand-1', 'cand-2']);
  });
});
