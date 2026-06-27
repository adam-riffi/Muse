import { type FormEvent, useState } from 'react';

export type BriefFormProps = {
  onSubmit: (brief: string) => void;
  loading: boolean;
};

export function BriefForm({ onSubmit, loading }: BriefFormProps) {
  const [brief, setBrief] = useState('');
  const canSubmit = brief.trim().length > 0 && !loading;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit(brief.trim());
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
        {loading ? 'Working…' : 'Explore styles'}
      </button>
    </form>
  );
}
