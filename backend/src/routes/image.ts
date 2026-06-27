import type { FastifyInstance } from 'fastify';
import type { FetchedImage } from '../services/image-fetch.js';
import type { SessionStore } from '../services/store.js';
import { makeThumbnail, type ThumbnailStore } from '../services/thumbnails.js';

export type ImageRouteDeps = {
  store: SessionStore;
  thumbnails: ThumbnailStore;
  fetchImage: (url: string) => Promise<FetchedImage>;
};

export function registerImageRoute(app: FastifyInstance, deps: ImageRouteDeps): void {
  app.get<{ Params: { id: string } }>('/image/:id/thumbnail', async (request, reply) => {
    const { id } = request.params;
    const candidate = deps.store.getCandidate(id);
    if (candidate === undefined) {
      return reply.code(404).send({ error: 'Not Found', message: `No candidate with id ${id}` });
    }

    let thumbnail = await deps.thumbnails.get(id);
    if (thumbnail === null) {
      try {
        const fetched = await deps.fetchImage(candidate.url);
        thumbnail = await makeThumbnail(fetched.buffer);
        await deps.thumbnails.put(id, thumbnail);
      } catch (error) {
        request.log.warn({ err: error, id }, 'thumbnail generation failed');
        return reply
          .code(502)
          .send({ error: 'Thumbnail Failed', message: 'Could not fetch or process the image' });
      }
    }

    return reply
      .header('content-type', 'image/webp')
      .header('cache-control', 'public, max-age=86400')
      .send(thumbnail);
  });
}
