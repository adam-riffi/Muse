import type { FastifyInstance } from 'fastify';
import { type ClarifyResult, ClarifyInputSchema } from '@muse/shared';
import { ClarifyError, type ClarifyEngineInput } from '../adapters/clarify.js';

export type ClarifyFn = (input: ClarifyEngineInput) => Promise<ClarifyResult>;

export type ClarifyRouteDeps = {
  clarify: ClarifyFn;
};

export function registerClarifyRoute(app: FastifyInstance, deps: ClarifyRouteDeps): void {
  app.post('/clarify', async (request, reply) => {
    const parsed = ClarifyInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid clarify request',
        issues: parsed.error.issues,
      });
    }

    try {
      return await deps.clarify(parsed.data);
    } catch (error) {
      if (error instanceof ClarifyError) {
        return reply.code(502).send({ error: 'Clarify Failed', message: error.message });
      }
      throw error;
    }
  });
}
