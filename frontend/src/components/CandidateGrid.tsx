import { useCandidateStore } from '../state/candidates';
import { CandidateImage } from './CandidateImage';

export function CandidateGrid() {
  const candidates = useCandidateStore((state) => state.candidates);

  if (candidates.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {candidates.map((candidate) => (
        <li
          key={candidate.id}
          className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
        >
          <CandidateImage candidate={candidate} className="aspect-square w-full object-cover" />
          <p className="p-2 text-xs text-zinc-400">{candidate.rationale}</p>
        </li>
      ))}
    </ul>
  );
}
