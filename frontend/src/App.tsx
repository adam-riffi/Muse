import { BriefForm } from './components/BriefForm';
import { CandidateGrid } from './components/CandidateGrid';
import { useCandidateStore } from './state/candidates';

export function App() {
  const status = useCandidateStore((state) => state.status);
  const error = useCandidateStore((state) => state.error);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Muse</h1>
          <p className="text-zinc-400">Describe a project; discover visual references.</p>
        </header>

        <BriefForm />

        {status === 'loading' && (
          <p role="status" className="text-zinc-400">
            Discovering references…
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="text-red-400">
            {error ?? 'Discovery failed'}
          </p>
        )}

        <CandidateGrid />
      </div>
    </main>
  );
}
