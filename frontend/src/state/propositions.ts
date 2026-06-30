import { create } from 'zustand';
import type { PropositionOption, PropositionRound } from '@muse/shared';
import { propose } from '../api/client';

export type PropositionStatus = 'idle' | 'loading' | 'success' | 'error';

export type PropositionState = {
  brief: string;
  round: PropositionRound | null;
  refinements: string[];
  status: PropositionStatus;
  error: string | null;
  start: (brief: string, refinements?: string[]) => Promise<void>;
  pick: (option: PropositionOption) => Promise<void>;
  reset: () => void;
};

export const usePropositionStore = create<PropositionState>((set, get) => {
  const runRound = async (brief: string, refinements: string[]): Promise<void> => {
    set({ status: 'loading', error: null, brief, refinements });
    try {
      const round = await propose({ brief, refinements });
      set({ round, status: 'success' });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Proposition failed',
      });
    }
  };

  return {
    brief: '',
    round: null,
    refinements: [],
    status: 'idle',
    error: null,
    start: (brief, refinements = []) => runRound(brief, refinements),
    pick: (option) => runRound(get().brief, [...get().refinements, option.descriptor]),
    reset: () => {
      set({ brief: '', round: null, refinements: [], status: 'idle', error: null });
    },
  };
});
