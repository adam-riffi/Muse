import { create } from 'zustand';
import { exportBundle, synthesize } from '../api/client';
import { downloadBlob } from '../lib/download';
import { useBoardStore } from './board';

export type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

// Skip the board PNG above ~45 MB of base64 so the export body stays under the server limit.
const MAX_BOARD_PNG_CHARS = 45 * 1024 * 1024;

export type ExportStore = {
  status: ExportStatus;
  error: string | null;
  run: () => Promise<void>;
  reset: () => void;
};

export const useExportStore = create<ExportStore>((set) => ({
  status: 'idle',
  error: null,
  run: async () => {
    const board = useBoardStore.getState();
    const imageIds = board.getKeptCandidateIds();
    if (imageIds.length === 0) {
      set({ status: 'error', error: 'Add at least one image to the board before exporting.' });
      return;
    }

    set({ status: 'loading', error: null });
    try {
      const analysis = await synthesize(imageIds);
      const boardPng = await board.getBoardPng();
      // Guard against an enormous board raster exceeding the server body limit: omit it rather than
      // failing the whole export (the rest of the bundle is still useful).
      const includePng = boardPng !== null && boardPng.length <= MAX_BOARD_PNG_CHARS;
      const blob = await exportBundle({
        imageIds,
        analysis,
        ...(includePng ? { boardPng } : {}),
      });
      downloadBlob(blob, 'moodboard-export.zip');
      set({ status: 'success', error: null });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Export failed',
      });
    }
  },
  reset: () => {
    set({ status: 'idle', error: null });
  },
}));
