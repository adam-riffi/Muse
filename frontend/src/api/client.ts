import type { BoardState, ImageCandidate, MoodboardAnalysis, PropositionRound } from '@muse/shared';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export type DiscoverRequest = {
  brief: string;
  count?: number;
  refinements?: string[];
};

export type ProposeRequest = {
  brief: string;
  refinements?: string[];
  count?: number;
};

export async function discover(
  body: DiscoverRequest,
  signal?: AbortSignal,
): Promise<ImageCandidate[]> {
  const response = await fetch(`${API_BASE}/discover`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Discovery request failed with status ${response.status}`);
  }
  return (await response.json()) as ImageCandidate[];
}

export async function propose(
  body: ProposeRequest,
  signal?: AbortSignal,
): Promise<PropositionRound> {
  const response = await fetch(`${API_BASE}/propose`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Proposition request failed with status ${response.status}`);
  }
  return (await response.json()) as PropositionRound;
}

export function thumbnailUrl(id: string): string {
  return `${API_BASE}/image/${id}/thumbnail`;
}

export async function searchImages(
  query: string,
  count?: number,
  signal?: AbortSignal,
): Promise<ImageCandidate[]> {
  const params = new URLSearchParams({ q: query });
  if (count !== undefined) {
    params.set('n', String(count));
  }
  const response = await fetch(`${API_BASE}/images/search?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Image search failed with status ${response.status}`);
  }
  return (await response.json()) as ImageCandidate[];
}

export async function loadBoard(): Promise<BoardState> {
  const response = await fetch(`${API_BASE}/board`);
  if (!response.ok) {
    throw new Error(`Load board failed with status ${response.status}`);
  }
  return (await response.json()) as BoardState;
}

export async function saveBoard(board: BoardState): Promise<void> {
  const response = await fetch(`${API_BASE}/board`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(board),
  });
  if (!response.ok) {
    throw new Error(`Save board failed with status ${response.status}`);
  }
}

export async function health(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return (await response.json()) as { status: string };
}

export async function synthesize(
  imageIds: string[],
  signal?: AbortSignal,
): Promise<MoodboardAnalysis> {
  const response = await fetch(`${API_BASE}/synthesize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageIds }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Synthesis failed with status ${response.status}`);
  }
  return (await response.json()) as MoodboardAnalysis;
}

export type ExportRequest = {
  imageIds: string[];
  analysis: MoodboardAnalysis;
  boardPng?: string;
};

export async function exportBundle(body: ExportRequest, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }
  return await response.blob();
}
