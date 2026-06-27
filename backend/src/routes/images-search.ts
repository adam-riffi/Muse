import type { FastifyInstance } from 'fastify';
import { ImageSourceError, type ImageSourceProvider } from '../services/image-source.js';
import type { SessionStore } from '../services/store.js';

export type ImagesSearchRouteDeps = {
  imageSource: ImageSourceProvider | null;
  store: SessionStore;
};

const DEFAULT_COUNT = 12;

export function registerImagesSearchRoute(app: FastifyInstance, deps: ImagesSearchRouteDeps): void {
  app.get('/images/search', async (request, reply) => {
    const query = request.query as { q?: unknown; n?: unknown };
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    if (q === '') {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Query parameter "q" is required',
      });
    }

    if (deps.imageSource === null) {
      return reply.code(501).send({
        error: 'Not Implemented',
        message: 'No image source is configured (set IMAGE_SOURCE=openverse|unsplash)',
      });
    }

    const parsedCount = typeof query.n === 'string' ? Number.parseInt(query.n, 10) : DEFAULT_COUNT;
    const count = Number.isNaN(parsedCount) ? DEFAULT_COUNT : parsedCount;

    try {
      const candidates = await deps.imageSource.search(q, count);
      deps.store.putCandidates(candidates);
      return candidates;
    } catch (error) {
      if (error instanceof ImageSourceError) {
        return reply.code(502).send({
          error: 'Image Source Failed',
          message: error.message,
        });
      }
      throw error;
    }
  });
}
