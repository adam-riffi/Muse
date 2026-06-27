import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import type { AppConfig } from './config.js';
import { registerHealthRoute } from './routes/health.js';

export type BuildServerOptions = {
  config: AppConfig;
};

export function buildServer({ config }: BuildServerOptions): FastifyInstance {
  const app = Fastify({ logger: resolveLogger(config) });

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

  return app;
}

function resolveLogger(config: AppConfig): FastifyServerOptions['logger'] {
  if (config.nodeEnv === 'test' || config.logLevel === 'silent') {
    return false;
  }
  return { level: config.logLevel };
}
