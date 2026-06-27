import { type FormEvent, useState } from 'react';
import { useCandidateStore } from '../state/candidates';

export function BriefForm() {
  const [brief, setBrief] = useState('');
  const status = useCandidateStore((state) => state.status);
  const runDiscovery = useCandidateStore((state) => state.runDiscovery);

  const isLoading = status === 'loading';
  const canSubmit = brief.trim().length > 0 && !isLoading;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    void runDiscovery({ brief: brief.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={brief}
        onChange={(event) => {
          setBrief(event.target.value);
        }}
        aria-label="Project brief"
        placeholder="Describe your project — mood, style, references…"
        rows={3}
        className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? 'Discovering…' : 'Discover references'}
      </button>
    </form>
  );
}
