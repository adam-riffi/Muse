import type { AgentStreamEvent } from '@muse/shared';
import { useCandidateStore } from '../state/candidates';

function describe(event: AgentStreamEvent): { icon: string; text: string; muted: boolean } {
  switch (event.kind) {
    case 'reasoning':
      return { icon: '💭', text: event.text, muted: false };
    case 'search':
      return { icon: '🔎', text: event.query, muted: false };
    case 'tool':
      return { icon: '🛠️', text: event.name, muted: true };
    default:
      return { icon: '⏳', text: event.text, muted: true };
  }
}

export function DiscoveryActivity() {
  const status = useCandidateStore((state) => state.status);
  const events = useCandidateStore((state) => state.events);

  if (status !== 'loading') {
    return null;
  }

  return (
    <section
      aria-label="Discovery activity"
      aria-live="polite"
      className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        The agent is searching the web…
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">Warming up…</p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {events.map((event, index) => {
            const { icon, text, muted } = describe(event);
            return (
              <li key={index} className={`flex gap-2 ${muted ? 'text-zinc-500' : 'text-zinc-300'}`}>
                <span aria-hidden>{icon}</span>
                <span className="min-w-0 break-words">{text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
