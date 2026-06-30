import { thumbnailUrl } from '../api/urls';
import { usePropositionStore } from '../state/propositions';

export function PropositionGrid() {
  const round = usePropositionStore((state) => state.round);
  const pick = usePropositionStore((state) => state.pick);
  const status = usePropositionStore((state) => state.status);

  if (round === null) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {round.options.map((option) => (
        <li
          key={option.id}
          className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
        >
          {option.preview !== undefined && (
            <img
              src={thumbnailUrl(option.preview.id)}
              alt={option.label}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          )}
          <div className="space-y-2 p-3">
            <p className="font-medium">{option.label}</p>
            <p className="text-xs text-zinc-400">{option.descriptor}</p>
            <button
              type="button"
              aria-label={`Choose ${option.label}`}
              onClick={() => void pick(option)}
              disabled={status === 'loading'}
              className="rounded bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:opacity-40"
            >
              Choose
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
