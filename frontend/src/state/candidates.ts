import { create } from 'zustand';
import type { AgentStreamEvent, ImageCandidate } from '@muse/shared';
import { discover, type DiscoverRequest, streamDiscover } from '../api/client';

export type DiscoveryStatus = 'idle' | 'loading' | 'success' | 'error';

const MAX_EVENTS = 60;

export type CandidateState = {
  candidates: ImageCandidate[];
  status: DiscoveryStatus;
  error: string | null;
  lastBrief: string | null;
  events: AgentStreamEvent[];
  runDiscovery: (request: DiscoverRequest) => Promise<void>;
  runDiscoveryStream: (request: DiscoverRequest) => void;
  reset: () => void;
};

// Coalesce consecutive reasoning deltas into one flowing thought; cap the feed length.
function appendEvent(events: AgentStreamEvent[], event: AgentStreamEvent): AgentStreamEvent[] {
  const next = events.slice();
  const last = next[next.length - 1];
  if (event.kind === 'reasoning' && last?.kind === 'reasoning') {
    next[next.length - 1] = { kind: 'reasoning', text: last.text + event.text };
  } else {
    next.push(event);
  }
  return next.slice(-MAX_EVENTS);
}

export const useCandidateStore = create<CandidateState>((set, get) => ({
  candidates: [],
  status: 'idle',
  error: null,
  lastBrief: null,
  events: [],
  runDiscovery: async (request) => {
    set({ status: 'loading', error: null, lastBrief: request.brief, events: [] });
    try {
      const candidates = await discover(request);
      set({ candidates, status: 'success' });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Discovery failed',
      });
    }
  },
  runDiscoveryStream: (request) => {
    // Fall back to the non-streaming request where EventSource is unavailable (e.g. jsdom in tests).
    if (typeof EventSource === 'undefined') {
      void get().runDiscovery(request);
      return;
    }
    set({ status: 'loading', error: null, lastBrief: request.brief, events: [], candidates: [] });
    streamDiscover(request, {
      onActivity: (event) => set((state) => ({ events: appendEvent(state.events, event) })),
      onResult: (candidates) => set({ candidates, status: 'success' }),
      onFailure: (message) => set({ status: 'error', error: message }),
    });
  },
  reset: () => {
    set({ candidates: [], status: 'idle', error: null, lastBrief: null, events: [] });
  },
}));
