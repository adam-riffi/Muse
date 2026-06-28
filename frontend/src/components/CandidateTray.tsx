import { useBoardStore } from '../state/board';
import { useCandidateStore } from '../state/candidates';
import { CandidateImage } from './CandidateImage';

export function CandidateTray() {
  const candidates = useCandidateStore((state) => state.candidates);
  const addCandidate = useBoardStore((state) => state.addCandidate);

  if (candidates.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Candidate tray"
      className="max-h-[70vh] w-44 shrink-0 space-y-3 overflow-y-auto pr-1"
    >
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
        >
          <CandidateImage candidate={candidate} className="aspect-square w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              addCandidate(candidate);
            }}
            aria-label={`Add ${candidate.title ?? candidate.id} to board`}
            className="w-full bg-zinc-800 px-2 py-1 text-xs text-zinc-200 transition hover:bg-zinc-700"
          >
            Add to board
          </button>
        </div>
      ))}
    </aside>
  );
}
