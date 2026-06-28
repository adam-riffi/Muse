import type { FastifyInstance } from 'fastify';
import { type ImageCandidate, DiscoverInputSchema } from '@muse/shared';
import type { AgentStreamEvent } from '../adapters/agent-stream.js';
import { CodexDiscoveryError, type DiscoverImagesInput } from '../adapters/codex.js';
import type { SessionStore } from '../services/store.js';

export type RunDiscoveryStream = (
  input: DiscoverImagesInput,
  onEvent: (event: AgentStreamEvent) => void,
) => Promise<ImageCandidate[]>;

export type DiscoverStreamRouteDeps = {
  runDiscovery: RunDiscoveryStream;
  store: SessionStore;
};

function parseQuery(query: unknown): DiscoverImagesInput | null {
  const q = (query ?? {}) as Record<string, unknown>;
  const brief = typeof q.brief === 'string' ? q.brief : '';
  let refinements: unknown;
  if (typeof q.refinements === 'string' && q.refinements.trim() !== '') {
    try {
      refinements = JSON.parse(q.refinements);
    } catch {
      refinements = undefined;
    }
  }
  const candidate = {
    brief,
    ...(typeof q.count === 'string' && q.count !== '' ? { count: Number(q.count) } : {}),
    ...(refinements !== undefined ? { refinements } : {}),
  };
  const parsed = DiscoverInputSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

// Server-Sent Events: streams the agent's progress (reasoning / web searches) while it works, then a
// terminal `result` event with the parsed candidates. Used by EventSource on the frontend so the user
// sees what the CLI is doing instead of staring at a spinner.
export function registerDiscoverStreamRoute(
  app: FastifyInstance,
  deps: DiscoverStreamRouteDeps,
): void {
  app.get('/discover/stream', async (request, reply) => {
    const input = parseQuery(request.query);
    if (input === null) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Invalid discovery request' });
    }

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });

    const send = (event: string, data: unknown): void => {
      raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('status', { kind: 'status', text: 'Searching…' } satisfies AgentStreamEvent);

    try {
      const candidates = await deps.runDiscovery(input, (event) => send('activity', event));
      deps.store.putCandidates(candidates);
      send('result', candidates);
    } catch (error) {
      const message =
        error instanceof CodexDiscoveryError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Discovery failed';
      send('failed', { message });
    } finally {
      raw.end();
    }
  });
}
