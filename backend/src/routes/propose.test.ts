import { describe, expect, it } from 'vitest';
import type { PropositionRound } from '@muse/shared';
import { PropositionError, type ProposeStylesInput } from '../adapters/proposition.js';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';
import { createSessionStore } from '../services/store.js';

const config = loadConfig({ NODE_ENV: 'test' });

const round: PropositionRound = {
  id: 'round-1',
  brief: 'anime',
  refinements: [],
  options: [
    {
      id: 'ghibli',
      label: 'Ghibli',
      descriptor: 'soft painterly anime',
      query: 'ghibli landscape',
      preview: {
        id: 'prev-ghibli',
        source: 'codex:websearch',
        url: 'https://x.com/g.jpg',
        rationale: 'soft painterly anime',
      },
    },
  ],
};

describe('POST /propose', () => {
  it('returns a round and stores its preview candidates', async () => {
    const store = createSessionStore();
    const app = buildServer({ config, deps: { propose: () => Promise.resolve(round), store } });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/propose',
        payload: { brief: 'anime' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ id: 'round-1' });
      expect(store.getCandidate('prev-ghibli')?.url).toBe('https://x.com/g.jpg');
    } finally {
      await app.close();
    }
  });

  it('forwards brief and refinements to the engine', async () => {
    let received: ProposeStylesInput | undefined;
    const app = buildServer({
      config,
      deps: {
        propose: (input) => {
          received = input;
          return Promise.resolve(round);
        },
      },
    });
    try {
      await app.inject({
        method: 'POST',
        url: '/propose',
        payload: { brief: 'anime', refinements: ['retro'] },
      });
      expect(received).toMatchObject({ brief: 'anime', refinements: ['retro'] });
    } finally {
      await app.close();
    }
  });

  it('rejects an empty brief with 400', async () => {
    const app = buildServer({ config, deps: { propose: () => Promise.resolve(round) } });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/propose',
        payload: { brief: '' },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('maps PropositionError to 502 with raw output', async () => {
    const app = buildServer({
      config,
      deps: { propose: () => Promise.reject(new PropositionError('boom', 'RAW')) },
    });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/propose',
        payload: { brief: 'x' },
      });
      expect(response.statusCode).toBe(502);
      expect(response.json()).toMatchObject({ error: 'Proposition Failed', raw: 'RAW' });
    } finally {
      await app.close();
    }
  });
});
