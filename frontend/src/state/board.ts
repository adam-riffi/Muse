import { create } from 'zustand';
import {
  type BoardState,
  type CanvasElement,
  type ImageCandidate,
  keptCandidateIds,
} from '@muse/shared';
import { thumbnailUrl } from '../api/client';
import {
  cameraToViewport,
  mapTldrawShape,
  type TldrawCamera,
  type TldrawShapeLike,
} from '../board/adapter';
import { buildImageAsset, buildImageShape } from '../board/place';

// The structural slice of the tldraw editor we depend on — keeps the store decoupled and testable.
export type BoardEditor = {
  getCurrentPageShapes: () => TldrawShapeLike[];
  getCamera: () => TldrawCamera;
  createAssets: (assets: unknown[]) => void;
  createShape: (shape: unknown) => void;
  deleteShapes: (ids: string[]) => void;
};

export type BoardStore = {
  editor: BoardEditor | null;
  setEditor: (editor: BoardEditor | null) => void;
  getBoardState: () => BoardState;
  getKeptCandidateIds: () => string[];
  addCandidate: (candidate: ImageCandidate) => void;
  removeCandidate: (candidateId: string) => void;
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
  addCandidate: (candidate) => {
    const { editor } = get();
    if (editor === null) {
      return;
    }
    editor.createAssets([buildImageAsset(candidate, thumbnailUrl(candidate.id))]);
    editor.createShape(buildImageShape(candidate, { x: 120, y: 120 }));
  },
  removeCandidate: (candidateId) => {
    const { editor } = get();
    if (editor === null) {
      return;
    }
    const ids = editor
      .getCurrentPageShapes()
      .filter((shape) => shape.meta?.candidateId === candidateId)
      .map((shape) => shape.id);
    if (ids.length > 0) {
      editor.deleteShapes(ids);
    }
  },
}));
