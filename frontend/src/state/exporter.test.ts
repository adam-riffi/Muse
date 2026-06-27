import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TldrawShapeLike } from '../board/adapter';
import { useBoardStore } from './board';
import { useExportStore } from './exporter';
import { server } from '../test/msw/server';

function keptEditor() {
  return {
    getCurrentPageShapes: (): TldrawShapeLike[] => [
      { id: 's1', type: 'image', x: 0, y: 0, props: { w: 10, h: 10 }, meta: { candidateId: 'a' } },
    ],
    getCamera: () => ({ x: 0, y: 0, z: 1 }),
    createAssets: vi.fn(),
    createShape: vi.fn(),
    deleteShapes: vi.fn(),
  };
}

beforeEach(() => {
  useBoardStore.getState().setEditor(null);
  useExportStore.getState().reset();
  HTMLAnchorElement.prototype.click = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useExportStore', () => {
  it('synthesizes, exports, and downloads for a kept board', async () => {
    useBoardStore.getState().setEditor(keptEditor());
    await useExportStore.getState().run();
    expect(useExportStore.getState().status).toBe('success');
  });

  it('errors when the board has no kept images', async () => {
    await useExportStore.getState().run();
    expect(useExportStore.getState().status).toBe('error');
    expect(useExportStore.getState().error).toMatch(/board/i);
  });

  it('surfaces a backend failure as an error', async () => {
    server.use(http.post('/api/synthesize', () => new HttpResponse(null, { status: 500 })));
    useBoardStore.getState().setEditor(keptEditor());
    await useExportStore.getState().run();
    expect(useExportStore.getState().status).toBe('error');
  });
});
