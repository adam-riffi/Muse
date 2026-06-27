import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { MoodboardAnalysisSchema } from '@muse/shared';
import { type Exporter, ExportError } from '../services/export-bundle.js';

export const ExportInputSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
  analysis: MoodboardAnalysisSchema,
  boardPng: z.string().optional(),
});

export type ExportRouteDeps = {
  exporter: Exporter;
};

export function registerExportRoute(app: FastifyInstance, deps: ExportRouteDeps): void {
  app.post('/export', async (request, reply) => {
    const parsed = ExportInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid export request',
        issues: parsed.error.issues,
      });
    }

    try {
      const zip = await deps.exporter.build(parsed.data);
      return reply
        .header('content-type', 'application/zip')
        .header('content-disposition', 'attachment; filename="moodboard-export.zip"')
        .send(Buffer.from(zip));
    } catch (error) {
      if (error instanceof ExportError) {
        return reply.code(400).send({ error: 'Export Failed', message: error.message });
      }
      throw error;
    }
  });
}
