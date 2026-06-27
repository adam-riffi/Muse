import { strToU8, zipSync } from 'fflate';
import type { MoodboardAnalysis } from '@muse/shared';
import {
  type ManifestImageInput,
  renderDesignBrief,
  renderDesignTokens,
  renderManifest,
  renderPrompt,
} from '../render/index.js';
import type { FetchedImage } from './image-fetch.js';
import type { SessionStore } from './store.js';

export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportError';
  }
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const EMPTY_BOARD = { elements: [], viewport: { x: 0, y: 0, zoom: 1 } };

export type ExportInput = {
  imageIds: readonly string[];
  analysis: MoodboardAnalysis;
  boardPng?: string;
};

export type Exporter = {
  build(input: ExportInput): Promise<Uint8Array>;
};

export type ExporterDeps = {
  store: SessionStore;
  fetchImage: (url: string) => Promise<FetchedImage>;
  now?: () => Date;
};

// Assembles the portable export bundle as a zip (in memory, deterministic): the kept images plus
// the rendered manifest, design tokens, brief, agent prompt, the board JSON, and — when the client
// supplies it — the rasterized board PNG. Pure aside from the injected image fetch.
export function createExporter(deps: ExporterDeps): Exporter {
  const now = deps.now ?? (() => new Date());
  return {
    async build(input) {
      const candidates = deps.store.getCandidates(input.imageIds);
      if (candidates.length === 0) {
        throw new ExportError('No known images for the provided ids');
      }

      const files: Record<string, Uint8Array> = {};
      const manifestImages: ManifestImageInput[] = [];
      for (const candidate of candidates) {
        const fetched = await deps.fetchImage(candidate.url);
        const ext = EXTENSION_BY_TYPE[fetched.contentType] ?? 'bin';
        const file = `images/${candidate.id}.${ext}`;
        files[file] = new Uint8Array(fetched.buffer);
        manifestImages.push({ candidate, file });
      }

      const manifest = renderManifest(manifestImages, now().toISOString());
      files['manifest.json'] = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);
      files['design-tokens.json'] = strToU8(
        `${JSON.stringify(renderDesignTokens(input.analysis), null, 2)}\n`,
      );
      files['design-brief.md'] = strToU8(renderDesignBrief(input.analysis, manifestImages));
      files['prompt.md'] = strToU8(renderPrompt(input.analysis));

      const board = deps.store.getBoard() ?? EMPTY_BOARD;
      files['board.json'] = strToU8(`${JSON.stringify(board, null, 2)}\n`);

      if (input.boardPng !== undefined && input.boardPng !== '') {
        files['board.png'] = new Uint8Array(Buffer.from(input.boardPng, 'base64'));
      }

      return zipSync(files);
    },
  };
}
