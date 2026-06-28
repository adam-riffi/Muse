import { usePropositionStore } from '../state/propositions';

export function RefinementBreadcrumb() {
  const refinements = usePropositionStore((state) => state.refinements);

  if (refinements.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Chosen refinements" className="flex flex-wrap items-center gap-2 text-xs">
      {refinements.map((descriptor, index) => (
        <span
          key={`${String(index)}-${descriptor}`}
          className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-300"
        >
          {descriptor}
        </span>
      ))}
    </nav>
  );
}
