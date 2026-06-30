import { describe, expect, it } from 'vitest';
import type { ClarifyResult } from '@muse/shared';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';
import { ClarifyError } from '../adapters/clarify.js';

const config = loadConfig({ NODE_ENV: 'test' });

const result: ClarifyResult = {
  questions: [{ id: 'q1', question: 'What mood?', hint: 'calm…' }],
};

describe('POST /clarify', () => {
  it('returns clarifying questions for a brief', async () => {
    const app = buildServer({ config, deps: { clarify: async () => result } });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/clarify',
        payload: { brief: 'a coffee brand' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(result);
    } finally {
      await app.close();
    }
  });

  it('returns 400 for a missing brief', async () => {
    const app = buildServer({ config, deps: { clarify: async () => result } });
    try {
      const response = await app.inject({ method: 'POST', url: '/clarify', payload: {} });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('maps a ClarifyError to 502', async () => {
    const app = buildServer({
      config,
      deps: {
        clarify: async () => {
          throw new ClarifyError('boom', 'raw');
        },
      },
    });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/clarify',
        payload: { brief: 'x' },
      });
      expect(response.statusCode).toBe(502);
    } finally {
      await app.close();
    }
  });
});
