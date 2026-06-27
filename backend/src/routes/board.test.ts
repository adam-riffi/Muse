import { describe, expect, it } from 'vitest';
import type { BoardState } from '@muse/shared';
import { buildServer } from '../app.js';
import { loadConfig } from '../config.js';

const config = loadConfig({ NODE_ENV: 'test' });

const board: BoardState = {
  elements: [
    {
      id: 'e1',
      type: 'image',
      x: 0,
      y: 0,
      rotation: 0,
      candidateId: 'cand-1',
      width: 200,
      height: 150,
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

describe('board routes', () => {
  it('GET /board returns an empty board initially', async () => {
    const app = buildServer({ config });
    try {
      const response = await app.inject({ method: 'GET', url: '/board' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ elements: [], viewport: { x: 0, y: 0, zoom: 1 } });
    } finally {
      await app.close();
    }
  });

  it('POST /board saves a board that GET then returns', async () => {
    const app = buildServer({ config });
    try {
      const save = await app.inject({ method: 'POST', url: '/board', payload: board });
      expect(save.statusCode).toBe(204);
      const load = await app.inject({ method: 'GET', url: '/board' });
      expect(load.json()).toMatchObject({ elements: [{ candidateId: 'cand-1' }] });
    } finally {
      await app.close();
    }
  });

  it('POST /board rejects an invalid board with 400', async () => {
    const app = buildServer({ config });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/board',
        payload: { elements: [{ type: 'bogus' }], viewport: {} },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});
