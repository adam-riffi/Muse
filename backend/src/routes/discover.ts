import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ImageCandidate } from '@muse/shared';
import { CodexDiscoveryError, type DiscoverImagesInput } from '../adapters/codex.js';
import type { SessionStore } from '../services/store.js';

const DiscoverBodySchema = z.object({
  brief: z.string().min(1),
  count: z.number().int().positive().max(50).optional(),
  refinements: z.array(z.string()).optional(),
});

export type DiscoverRouteDeps = {
  discover: (input: DiscoverImagesInput) => Promise<ImageCandidate[]>;
  store: SessionStore;
};

export function registerDiscoverRoute(app: FastifyInstance, deps: DiscoverRouteDeps): void {
  app.post('/discover', async (request, reply) => {
    const parsed = DiscoverBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid discovery request',
        issues: parsed.error.issues,
      });
    }

    try {
      const candidates = await deps.discover(parsed.data);
      deps.store.putCandidates(candidates);
      return candidates;
    } catch (error) {
      if (error instanceof CodexDiscoveryError) {
        return reply.code(502).send({
          error: 'Discovery Failed',
          message: error.message,
          raw: error.rawOutput,
        });
      }
      throw error;
    }
  });
}
