import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MoodboardAnalysis } from '@muse/shared';
import { SynthesizeError } from '../services/synthesize.js';
import { VlmAnalysisError } from '../services/vlm.js';

export const SynthesizeInputSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
});

export type SynthesizeFn = (imageIds: string[]) => Promise<MoodboardAnalysis>;

export type SynthesizeRouteDeps = {
  synthesize: SynthesizeFn | null;
};

export function registerSynthesizeRoute(app: FastifyInstance, deps: SynthesizeRouteDeps): void {
  app.post('/synthesize', async (request, reply) => {
    const parsed = SynthesizeInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid synthesize request',
        issues: parsed.error.issues,
      });
    }

    if (deps.synthesize === null) {
      return reply.code(501).send({
        error: 'Not Implemented',
        message: 'No VLM provider configured (set VLM_PROVIDER and an API key)',
      });
    }

    try {
      return await deps.synthesize(parsed.data.imageIds);
    } catch (error) {
      if (error instanceof SynthesizeError) {
        return reply.code(400).send({ error: 'Synthesis Failed', message: error.message });
      }
      if (error instanceof VlmAnalysisError) {
        return reply.code(502).send({
          error: 'Synthesis Failed',
          message: error.message,
          raw: error.rawOutput,
        });
      }
      throw error;
    }
  });
}
