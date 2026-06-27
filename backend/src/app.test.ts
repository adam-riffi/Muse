import { describe, expect, it } from 'vitest';
import { buildServer } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig({ NODE_ENV: 'test' });

describe('buildServer', () => {
  it('GET /health returns 200 with status ok', async () => {
    const app = buildServer({ config });
    try {
      const response = await app.inject({ method: 'GET', url: '/health' });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { status: string; uptime: number; timestamp: string };
      expect(body.status).toBe('ok');
      expect(typeof body.uptime).toBe('number');
      expect(typeof body.timestamp).toBe('string');
    } finally {
      await app.close();
    }
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const app = buildServer({ config });
    try {
      const response = await app.inject({ method: 'GET', url: '/does-not-exist' });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ error: 'Not Found' });
    } finally {
      await app.close();
    }
  });
});
