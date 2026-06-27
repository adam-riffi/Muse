import type { FastifyInstance } from 'fastify';
import { type BoardState, BoardStateSchema } from '@muse/shared';
import type { SessionStore } from '../services/store.js';

export type BoardRouteDeps = {
  store: SessionStore;
};

const EMPTY_BOARD: BoardState = { elements: [], viewport: { x: 0, y: 0, zoom: 1 } };

export function registerBoardRoute(app: FastifyInstance, deps: BoardRouteDeps): void {
  app.get('/board', async () => {
    return deps.store.getBoard() ?? EMPTY_BOARD;
  });

  app.post('/board', async (request, reply) => {
    const parsed = BoardStateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid board state',
        issues: parsed.error.issues,
      });
    }
    deps.store.setBoard(parsed.data);
    return reply.code(204).send();
  });
}
