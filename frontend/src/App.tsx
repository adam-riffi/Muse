import { BriefForm } from './components/BriefForm';
import { CandidateGrid } from './components/CandidateGrid';
import { CandidateTray } from './components/CandidateTray';
import { PropositionGrid } from './components/PropositionGrid';
import { RefinementBreadcrumb } from './components/RefinementBreadcrumb';
import { Whiteboard } from './components/Whiteboard';
import { useCandidateStore } from './state/candidates';
import { usePropositionStore } from './state/propositions';

export function App() {
  const propStatus = usePropositionStore((state) => state.status);
  const propError = usePropositionStore((state) => state.error);
  const round = usePropositionStore((state) => state.round);
  const brief = usePropositionStore((state) => state.brief);
  const refinements = usePropositionStore((state) => state.refinements);
  const startPropositions = usePropositionStore((state) => state.start);
  const resetPropositions = usePropositionStore((state) => state.reset);

  const discoverStatus = useCandidateStore((state) => state.status);
  const discoverError = useCandidateStore((state) => state.error);
  const runDiscovery = useCandidateStore((state) => state.runDiscovery);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Muse</h1>
          <p className="text-zinc-400">
            Describe a project; refine the style; discover references; curate.
          </p>
        </header>

        <BriefForm
          onSubmit={(value) => void startPropositions(value)}
          loading={propStatus === 'loading'}
        />

        {propStatus === 'error' && (
          <p role="alert" className="text-red-400">
            {propError ?? 'Could not load style options'}
          </p>
        )}

        {round !== null && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <RefinementBreadcrumb />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void runDiscovery({ brief, refinements })}
                  disabled={discoverStatus === 'loading'}
                  className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  {discoverStatus === 'loading' ? 'Searching…' : 'Search now'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetPropositions();
                  }}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300 transition hover:bg-zinc-800"
                >
                  Start over
                </button>
              </div>
            </div>
            <PropositionGrid />
          </section>
        )}

        {discoverStatus === 'error' && (
          <p role="alert" className="text-red-400">
            {discoverError ?? 'Discovery failed'}
          </p>
        )}

        <CandidateGrid />

        <section aria-label="Whiteboard" className="space-y-3">
          <h2 className="text-lg font-medium">Whiteboard</h2>
          <p className="text-sm text-zinc-500">
            Add references to the board and annotate to shape your direction.
          </p>
          <div className="flex gap-4">
            <CandidateTray />
            <div className="min-w-0 flex-1">
              <Whiteboard />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
