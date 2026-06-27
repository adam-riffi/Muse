import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import type { ImageCandidate, PropositionRound } from '@muse/shared';
import { resolveAgentRunner } from './adapters/agent-runner.js';
import { discoverImages, type DiscoverImagesInput } from './adapters/codex.js';
import { createPropositionEngine, type ProposeStylesInput } from './adapters/proposition.js';
import type { AppConfig } from './config.js';
import { registerBoardRoute } from './routes/board.js';
import { registerDiscoverRoute } from './routes/discover.js';
import { registerExportRoute } from './routes/export.js';
import { registerHealthRoute } from './routes/health.js';
import { registerImageRoute } from './routes/image.js';
import { registerImagesSearchRoute } from './routes/images-search.js';
import { registerProposeRoute } from './routes/propose.js';
import { registerSynthesizeRoute, type SynthesizeFn } from './routes/synthesize.js';
import { type CliStatus, detectAgentCli } from './services/cli-detect.js';
import { createExporter, type Exporter } from './services/export-bundle.js';
import { fetchImage, type FetchedImage } from './services/image-fetch.js';
import { createImageSource, type ImageSourceProvider } from './services/image-source.js';
import { createSessionStore, type SessionStore } from './services/store.js';
import { createSynthesizer } from './services/synthesize.js';
import { createThumbnailStore, type ThumbnailStore } from './services/thumbnails.js';
import { createVlmAnalyzer } from './services/vlm.js';
import { createVlmProvider } from './services/vlm-providers.js';

export type ServerDeps = {
  discover: (input: DiscoverImagesInput) => Promise<ImageCandidate[]>;
  propose: (input: ProposeStylesInput) => Promise<PropositionRound>;
  store: SessionStore;
  thumbnails: ThumbnailStore;
  fetchImage: (url: string) => Promise<FetchedImage>;
  imageSource: ImageSourceProvider | null;
  synthesize: SynthesizeFn | null;
  exporter: Exporter;
  detectCli: () => Promise<CliStatus>;
};

export type BuildServerOptions = {
  config: AppConfig;
  deps?: Partial<ServerDeps>;
};

export function buildServer({ config, deps }: BuildServerOptions): FastifyInstance {
  const app = Fastify({ logger: resolveLogger(config) });
  const store = deps?.store ?? createSessionStore();
  const runner = resolveAgentRunner(config);
  const discover =
    deps?.discover ?? ((input: DiscoverImagesInput) => discoverImages(input, { runner }));
  const propose = deps?.propose ?? createPropositionEngine({ runner }).propose;
  const thumbnails = deps?.thumbnails ?? createThumbnailStore();
  const fetchImageImpl = deps?.fetchImage ?? ((url: string) => fetchImage(url));
  const imageSource = deps?.imageSource ?? createImageSource(config);
  const vlmProvider = createVlmProvider(config);
  const analyzer = vlmProvider !== null ? createVlmAnalyzer({ provider: vlmProvider }) : null;
  const synthesize =
    deps?.synthesize ??
    (analyzer !== null
      ? createSynthesizer({ store, fetchImage: fetchImageImpl, analyzer }).synthesize
      : null);
  const exporter = deps?.exporter ?? createExporter({ store, fetchImage: fetchImageImpl });
  const detectCli = deps?.detectCli ?? (() => detectAgentCli(config));

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

  registerHealthRoute(app, { detect: detectCli });
  registerDiscoverRoute(app, { discover, store });
  registerProposeRoute(app, { propose, store });
  registerImageRoute(app, { store, thumbnails, fetchImage: fetchImageImpl });
  registerImagesSearchRoute(app, { imageSource, store });
  registerSynthesizeRoute(app, { synthesize });
  registerExportRoute(app, { exporter });
  registerBoardRoute(app, { store });

  return app;
}

function resolveLogger(config: AppConfig): FastifyServerOptions['logger'] {
  if (config.nodeEnv === 'test' || config.logLevel === 'silent') {
    return false;
  }
  return { level: config.logLevel };
}
