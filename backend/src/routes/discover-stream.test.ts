import { describe, expect, it } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';

const config = loadConfig({ NODE_ENV: 'test' });

const candidates: ImageCandidate[] = [
  { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits' },
];

describe('GET /discover/stream', () => {
  it('streams activity events then a result event with candidates', async () => {
    const app = buildServer({
      config,
      deps: {
        runDiscoveryStream: async (_input, onEvent) => {
          onEvent({ kind: 'reasoning', text: 'thinking' });
          onEvent({ kind: 'search', query: 'cozy nook' });
          return candidates;
        },
      },
    });
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/discover/stream?brief=cozy%20nook',
      });
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      const body = response.body;
      expect(body).toContain('event: activity');
      expect(body).toContain('"query":"cozy nook"');
      expect(body).toContain('event: result');
      expect(body).toContain('https://x.com/a.jpg');
    } finally {
      await app.close();
    }
  });

  it('emits an error event when discovery fails', async () => {
    const app = buildServer({
      config,
      deps: {
        runDiscoveryStream: async () => {
          throw new Error('boom');
        },
      },
    });
    try {
      const response = await app.inject({ method: 'GET', url: '/discover/stream?brief=x' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('event: failed');
      expect(response.body).toContain('boom');
    } finally {
      await app.close();
    }
  });

  it('returns 400 for a missing brief', async () => {
    const app = buildServer({ config });
    try {
      const response = await app.inject({ method: 'GET', url: '/discover/stream' });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});
