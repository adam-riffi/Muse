import { create } from 'zustand';
import type { ClarifyQuestion } from '@muse/shared';
import { clarify } from '../api/client';

export type ClarifyStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ClarifyState = {
  status: ClarifyStatus;
  error: string | null;
  brief: string;
  questions: ClarifyQuestion[];
  answers: Record<string, string>;
  start: (brief: string) => Promise<void>;
  setAnswer: (id: string, value: string) => void;
  /** Non-empty answers, as refinement phrases to seed propositions/discovery. */
  refinements: () => string[];
  reset: () => void;
};

export const useClarifyStore = create<ClarifyState>((set, get) => ({
  status: 'idle',
  error: null,
  brief: '',
  questions: [],
  answers: {},
  start: async (brief) => {
    set({ status: 'loading', error: null, brief, questions: [], answers: {} });
    try {
      const result = await clarify(brief);
      set({ questions: result.questions, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Intake failed' });
    }
  },
  setAnswer: (id, value) => {
    set((state) => ({ answers: { ...state.answers, [id]: value } }));
  },
  refinements: () => {
    const { answers } = get();
    return Object.values(answers)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  },
  reset: () => {
    set({ status: 'idle', error: null, brief: '', questions: [], answers: {} });
  },
}));
