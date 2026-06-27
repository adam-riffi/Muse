import { create } from 'zustand';
import { type BoardState, type CanvasElement, keptCandidateIds } from '@muse/shared';
import {
  cameraToViewport,
  mapTldrawShape,
  type TldrawCamera,
  type TldrawShapeLike,
} from '../board/adapter';

// The structural slice of the tldraw editor we depend on — keeps the store decoupled and testable.
export type BoardEditor = {
  getCurrentPageShapes: () => TldrawShapeLike[];
  getCamera: () => TldrawCamera;
};

export type BoardStore = {
  editor: BoardEditor | null;
  setEditor: (editor: BoardEditor | null) => void;
  getBoardState: () => BoardState;
  getKeptCandidateIds: () => string[];
};

const EMPTY_BOARD: BoardState = { elements: [], viewport: { x: 0, y: 0, zoom: 1 } };

export const useBoardStore = create<BoardStore>((set, get) => ({
  editor: null,
  setEditor: (editor) => {
    set({ editor });
  },
  getBoardState: () => {
    const { editor } = get();
    if (editor === null) {
      return EMPTY_BOARD;
    }
    const elements = editor
      .getCurrentPageShapes()
      .map(mapTldrawShape)
      .filter((element): element is CanvasElement => element !== null);
    return { elements, viewport: cameraToViewport(editor.getCamera()) };
  },
  getKeptCandidateIds: () => keptCandidateIds(get().getBoardState()),
}));
