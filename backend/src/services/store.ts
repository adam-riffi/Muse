import type { BoardState, ImageCandidate } from '@muse/shared';

export type SessionStore = {
  putCandidates(candidates: readonly ImageCandidate[]): void;
  getCandidate(id: string): ImageCandidate | undefined;
  getCandidates(ids: readonly string[]): ImageCandidate[];
  allCandidates(): ImageCandidate[];
  size(): number;
  clear(): void;
  getBoard(): BoardState | null;
  setBoard(board: BoardState): void;
};

// In-memory, single-session store for the MVP (auth/multi-user are non-goals). Indexes the most
// recently discovered candidates by id so later stages (synthesis/export) can resolve the kept set,
// and holds the latest persisted whiteboard BoardState.
export function createSessionStore(): SessionStore {
  const candidates = new Map<string, ImageCandidate>();
  let board: BoardState | null = null;

  return {
    putCandidates(incoming) {
      for (const candidate of incoming) {
        candidates.set(candidate.id, candidate);
      }
    },
    getCandidate(id) {
      return candidates.get(id);
    },
    getCandidates(ids) {
      const result: ImageCandidate[] = [];
      for (const id of ids) {
        const found = candidates.get(id);
        if (found !== undefined) {
          result.push(found);
        }
      }
      return result;
    },
    allCandidates() {
      return [...candidates.values()];
    },
    size() {
      return candidates.size;
    },
    clear() {
      candidates.clear();
      board = null;
    },
    getBoard() {
      return board;
    },
    setBoard(next) {
      board = next;
    },
  };
}
