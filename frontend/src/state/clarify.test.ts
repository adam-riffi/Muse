import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../test/msw/server';
import { useClarifyStore } from './clarify';

beforeEach(() => {
  useClarifyStore.getState().reset();
});

describe('useClarifyStore', () => {
  it('loads questions for a brief', async () => {
    await useClarifyStore.getState().start('a coffee brand');
    const state = useClarifyStore.getState();
    expect(state.status).toBe('ready');
    expect(state.brief).toBe('a coffee brand');
    expect(state.questions.length).toBeGreaterThan(0);
  });

  it('collects non-empty answers as refinements', async () => {
    await useClarifyStore.getState().start('x');
    useClarifyStore.getState().setAnswer('q1', '  dreamy  ');
    useClarifyStore.getState().setAnswer('q2', '   ');
    expect(useClarifyStore.getState().refinements()).toEqual(['dreamy']);
  });

  it('sets error status when the request fails', async () => {
    server.use(http.post('/api/clarify', () => new HttpResponse(null, { status: 502 })));
    await useClarifyStore.getState().start('x');
    expect(useClarifyStore.getState().status).toBe('error');
    expect(useClarifyStore.getState().error).not.toBeNull();
  });
});
