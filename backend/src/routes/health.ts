import type { FastifyInstance } from 'fastify';
import type { CliStatus } from '../services/cli-detect.js';

export type HealthRouteDeps = {
  detect: () => Promise<CliStatus>;
};

const CACHE_TTL_MS = 30_000;

// `/health` reports liveness plus the detected agent CLI (provider, binary, availability, version).
// Detection spawns `<bin> --version`, so the result is cached briefly to keep polling cheap.
export function registerHealthRoute(app: FastifyInstance, deps: HealthRouteDeps): void {
  let cached: CliStatus | null = null;
  let cachedAt = 0;

  async function agentStatus(): Promise<CliStatus> {
    const now = Date.now();
    if (cached !== null && now - cachedAt < CACHE_TTL_MS) {
      return cached;
    }
    cached = await deps.detect();
    cachedAt = now;
    return cached;
  }

  app.get('/health', async () => {
    return {
      status: 'ok' as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      agent: await agentStatus(),
    };
  });
}
