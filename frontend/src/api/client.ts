import type { ImageCandidate } from '@muse/shared';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export type DiscoverRequest = {
  brief: string;
  count?: number;
  refinements?: string[];
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

export async function health(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  return (await response.json()) as { status: string };
}
