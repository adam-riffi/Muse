import type {
  AgentStreamEvent,
  BoardState,
  ImageCandidate,
  MoodboardAnalysis,
  PropositionRound,
} from '@muse/shared';

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

export type DiscoveryStreamHandlers = {
  onActivity: (event: AgentStreamEvent) => void;
  onResult: (candidates: ImageCandidate[]) => void;
  onFailure: (message: string) => void;
};

type EventSourceLike = {
  addEventListener: (type: string, listener: (event: { data: string }) => void) => void;
  close: () => void;
  onerror: ((event: unknown) => void) | null;
};

// Subscribes to the SSE discovery stream, forwarding live progress (reasoning / web searches) and the
// terminal candidate list. Returns an unsubscribe function. The EventSource factory is injectable for
// tests. `data` payloads are JSON.
export function streamDiscover(
  request: DiscoverRequest,
  handlers: DiscoveryStreamHandlers,
  makeEventSource: (url: string) => EventSourceLike = (url) =>
    new EventSource(url) as unknown as EventSourceLike,
): () => void {
  const params = new URLSearchParams({ brief: request.brief });
  if (request.count !== undefined) {
    params.set('count', String(request.count));
  }
  if (request.refinements && request.refinements.length > 0) {
    params.set('refinements', JSON.stringify(request.refinements));
  }

  const source = makeEventSource(`${API_BASE}/discover/stream?${params.toString()}`);
  let done = false;
  const finish = (): void => {
    if (!done) {
      done = true;
      source.close();
    }
  };

  const forwardActivity = (event: { data: string }): void => {
    try {
      handlers.onActivity(JSON.parse(event.data) as AgentStreamEvent);
    } catch {
      // ignore malformed activity frames
    }
  };
  source.addEventListener('status', forwardActivity);
  source.addEventListener('activity', forwardActivity);
  source.addEventListener('result', (event) => {
    try {
      handlers.onResult(JSON.parse(event.data) as ImageCandidate[]);
    } catch {
      handlers.onFailure('Received a malformed result');
    }
    finish();
  });
  source.addEventListener('failed', (event) => {
    let message = 'Discovery failed';
    try {
      message = (JSON.parse(event.data) as { message?: string }).message ?? message;
    } catch {
      // keep default
    }
    handlers.onFailure(message);
    finish();
  });
  source.onerror = () => {
    if (!done) {
      handlers.onFailure('Connection to the discovery stream was lost');
      finish();
    }
  };

  return finish;
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
