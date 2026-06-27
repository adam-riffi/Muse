import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TldrawShapeLike } from '../board/adapter';
import { ExportPanel } from './ExportPanel';
import { useBoardStore } from '../state/board';
import { useExportStore } from '../state/exporter';

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

describe('ExportPanel', () => {
  it('downloads a bundle when the board has kept images', async () => {
    useBoardStore.getState().setEditor(keptEditor());
    const user = userEvent.setup();
    render(<ExportPanel />);

    await user.click(screen.getByRole('button', { name: 'Export bundle' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Bundle downloaded.');
  });

  it('shows an error when there is nothing to export', async () => {
    const user = userEvent.setup();
    render(<ExportPanel />);

    await user.click(screen.getByRole('button', { name: 'Export bundle' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
