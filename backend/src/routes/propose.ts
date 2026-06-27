import type { FastifyInstance } from 'fastify';
import { type ImageCandidate, DiscoverInputSchema, type PropositionRound } from '@muse/shared';
import { PropositionError, type ProposeStylesInput } from '../adapters/proposition.js';
import type { SessionStore } from '../services/store.js';

export type ProposeRouteDeps = {
  propose: (input: ProposeStylesInput) => Promise<PropositionRound>;
  store: SessionStore;
};

export function registerProposeRoute(app: FastifyInstance, deps: ProposeRouteDeps): void {
  app.post('/propose', async (request, reply) => {
    const parsed = DiscoverInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid proposition request',
        issues: parsed.error.issues,
      });
    }

    try {
      const round = await deps.propose(parsed.data);
      // Register preview candidates so GET /image/:id/thumbnail can resolve and serve them.
      const previews = round.options
        .map((option) => option.preview)
        .filter((preview): preview is ImageCandidate => preview !== undefined);
      deps.store.putCandidates(previews);
      return round;
    } catch (error) {
      if (error instanceof PropositionError) {
        return reply.code(502).send({
          error: 'Proposition Failed',
          message: error.message,
          raw: error.rawOutput,
        });
      }
      throw error;
    }
  });
}
