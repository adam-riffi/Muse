import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import type { TldrawShapeLike } from '../board/adapter';
import { useBoardStore } from './board';

beforeEach(() => {
  useBoardStore.getState().setEditor(null);
});

function fakeEditor(shapes: TldrawShapeLike[] = []) {
  return {
    getCurrentPageShapes: () => shapes,
    getCamera: () => ({ x: 0, y: 0, z: 1 }),
    createAssets: vi.fn(),
    createShape: vi.fn(),
    deleteShapes: vi.fn(),
  };
}

const candidate: ImageCandidate = {
  id: 'cand-1',
  source: 'codex:websearch',
  url: 'https://x.com/a.jpg',
  rationale: 'fits',
};

describe('useBoardStore', () => {
  it('returns an empty board when no editor is mounted', () => {
    expect(useBoardStore.getState().getBoardState().elements).toEqual([]);
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
    expect(
      useBoardStore
        .getState()
        .getBoardState()
        .elements.map((e) => e.type),
    ).toEqual(['image', 'rect']);
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

  it('addCandidate creates an asset and an image shape carrying the candidateId', () => {
    const editor = fakeEditor();
    useBoardStore.getState().setEditor(editor);
    useBoardStore.getState().addCandidate(candidate);
    expect(editor.createAssets).toHaveBeenCalledOnce();
    expect(editor.createShape).toHaveBeenCalledOnce();
    expect(editor.createShape.mock.calls[0]?.[0]).toMatchObject({
      meta: { candidateId: 'cand-1' },
    });
  });

  it('removeCandidate deletes the shapes for that candidate', () => {
    const editor = fakeEditor([
      { id: 's1', type: 'image', x: 0, y: 0, meta: { candidateId: 'cand-1' } },
      { id: 's2', type: 'image', x: 0, y: 0, meta: { candidateId: 'cand-2' } },
    ]);
    useBoardStore.getState().setEditor(editor);
    useBoardStore.getState().removeCandidate('cand-1');
    expect(editor.deleteShapes).toHaveBeenCalledWith(['s1']);
  });

  it('does nothing when no editor is mounted', () => {
    expect(() => {
      useBoardStore.getState().addCandidate(candidate);
      useBoardStore.getState().removeCandidate('cand-1');
    }).not.toThrow();
  });
});
