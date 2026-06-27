import type { ImageCandidate, PropositionRound } from '@muse/shared';

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

export async function health(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return (await response.json()) as { status: string };
}
