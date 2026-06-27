import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import type { ImageCandidate, PropositionRound } from '@muse/shared';
import { discoverImages, type DiscoverImagesInput } from './adapters/codex.js';
import { createPropositionEngine, type ProposeStylesInput } from './adapters/proposition.js';
import type { AppConfig } from './config.js';
import { registerDiscoverRoute } from './routes/discover.js';
import { registerHealthRoute } from './routes/health.js';
import { registerImageRoute } from './routes/image.js';
import { registerProposeRoute } from './routes/propose.js';
import { fetchImage, type FetchedImage } from './services/image-fetch.js';
import { createSessionStore, type SessionStore } from './services/store.js';
import { createThumbnailStore, type ThumbnailStore } from './services/thumbnails.js';

export type ServerDeps = {
  discover: (input: DiscoverImagesInput) => Promise<ImageCandidate[]>;
  propose: (input: ProposeStylesInput) => Promise<PropositionRound>;
  store: SessionStore;
  thumbnails: ThumbnailStore;
  fetchImage: (url: string) => Promise<FetchedImage>;
};

export type BuildServerOptions = {
  config: AppConfig;
  deps?: Partial<ServerDeps>;
};

export function buildServer({ config, deps }: BuildServerOptions): FastifyInstance {
  const app = Fastify({ logger: resolveLogger(config) });
  const store = deps?.store ?? createSessionStore();
  const discover = deps?.discover ?? ((input: DiscoverImagesInput) => discoverImages(input));
  const propose = deps?.propose ?? createPropositionEngine().propose;
  const thumbnails = deps?.thumbnails ?? createThumbnailStore();
  const fetchImageImpl = deps?.fetchImage ?? ((url: string) => fetchImage(url));

  app.setNotFoundHandler((request, reply) => {
    void reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    request.log.error({ err: error }, 'request failed');
    const statusCode = error.statusCode ?? 500;
    const isServerError = statusCode >= 500;
    void reply.code(statusCode).send({
      error: isServerError ? 'Internal Server Error' : error.name,
      message: isServerError ? 'An unexpected error occurred' : error.message,
    });
  });

  registerHealthRoute(app);
  registerDiscoverRoute(app, { discover, store });
  registerProposeRoute(app, { propose, store });
  registerImageRoute(app, { store, thumbnails, fetchImage: fetchImageImpl });

  return app;
}

function resolveLogger(config: AppConfig): FastifyServerOptions['logger'] {
  if (config.nodeEnv === 'test' || config.logLevel === 'silent') {
    return false;
  }
  return { level: config.logLevel };
}
