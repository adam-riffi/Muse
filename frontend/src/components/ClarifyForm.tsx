import { useClarifyStore } from '../state/clarify';

export type ClarifyFormProps = {
  /** Proceed to the style search, seeded with the answers (as refinements). */
  onSubmit: (refinements: string[]) => void;
};

export function ClarifyForm({ onSubmit }: ClarifyFormProps) {
  const status = useClarifyStore((state) => state.status);
  const error = useClarifyStore((state) => state.error);
  const questions = useClarifyStore((state) => state.questions);
  const answers = useClarifyStore((state) => state.answers);
  const setAnswer = useClarifyStore((state) => state.setAnswer);
  const refinements = useClarifyStore((state) => state.refinements);

  if (status === 'loading') {
    return (
      <p role="status" className="text-zinc-400">
        Thinking of a few questions to sharpen the search…
      </p>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-amber-400">
          {error ?? 'Could not generate questions'}
        </p>
        <button
          type="button"
          onClick={() => onSubmit([])}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-emerald-400"
        >
          Explore styles anyway
        </button>
      </div>
    );
  }

  if (status !== 'ready') {
    return null;
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-zinc-300">Your brief looks specific enough — ready to explore styles.</p>
        <button
          type="button"
          onClick={() => onSubmit([])}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-emerald-400"
        >
          Explore styles
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Narrow your search" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">A few quick questions</h2>
        <p className="text-sm text-zinc-500">Answer what you can — it sharpens the search.</p>
      </div>
      <div className="space-y-3">
        {questions.map((question) => (
          <label key={question.id} className="block space-y-1">
            <span className="text-sm text-zinc-300">{question.question}</span>
            <input
              type="text"
              value={answers[question.id] ?? ''}
              onChange={(event) => {
                setAnswer(question.id, event.target.value);
              }}
              placeholder={question.hint}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(refinements())}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-zinc-950 transition hover:bg-emerald-400"
        >
          Explore styles
        </button>
        <button
          type="button"
          onClick={() => onSubmit([])}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300 transition hover:bg-zinc-800"
        >
          Skip
        </button>
      </div>
    </section>
  );
}
