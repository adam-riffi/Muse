import { create } from 'zustand';
import type { ImageCandidate } from '@muse/shared';
import { discover, type DiscoverRequest } from '../api/client';

export type DiscoveryStatus = 'idle' | 'loading' | 'success' | 'error';

export type CandidateState = {
  candidates: ImageCandidate[];
  status: DiscoveryStatus;
  error: string | null;
  lastBrief: string | null;
  runDiscovery: (request: DiscoverRequest) => Promise<void>;
  reset: () => void;
};

export const useCandidateStore = create<CandidateState>((set) => ({
  candidates: [],
  status: 'idle',
  error: null,
  lastBrief: null,
  runDiscovery: async (request) => {
    set({ status: 'loading', error: null, lastBrief: request.brief });
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
  reset: () => {
    set({ candidates: [], status: 'idle', error: null, lastBrief: null });
  },
}));
