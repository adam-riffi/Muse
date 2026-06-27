import { describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import type { CliStatus } from '../services/cli-detect.js';
import { registerHealthRoute } from './health.js';

const status: CliStatus = {
  provider: 'copilot',
  bin: 'copilot',
  available: true,
  version: '1.0.65',
};

describe('GET /health', () => {
  it('reports liveness and the detected agent', async () => {
    const app = Fastify();
    registerHealthRoute(app, { detect: async () => status });
    try {
      const response = await app.inject({ method: 'GET', url: '/health' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status: 'ok', agent: status });
    } finally {
      await app.close();
    }
  });

  it('caches detection across requests', async () => {
    const detect = vi.fn(async () => status);
    const app = Fastify();
    registerHealthRoute(app, { detect });
    try {
      await app.inject({ method: 'GET', url: '/health' });
      await app.inject({ method: 'GET', url: '/health' });
      expect(detect).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
    }
  });
});
