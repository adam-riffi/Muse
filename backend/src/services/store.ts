import type { ImageCandidate } from '@muse/shared';

export type SessionStore = {
  putCandidates(candidates: readonly ImageCandidate[]): void;
  getCandidate(id: string): ImageCandidate | undefined;
  getCandidates(ids: readonly string[]): ImageCandidate[];
  allCandidates(): ImageCandidate[];
  size(): number;
  clear(): void;
};

// In-memory, single-session store for the MVP (auth/multi-user are non-goals). Indexes the most
// recently discovered candidates by id so later stages (synthesis/export) can resolve the kept set.
export function createSessionStore(): SessionStore {
  const candidates = new Map<string, ImageCandidate>();

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
    },
  };
}
