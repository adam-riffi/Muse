import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../test/msw/server';
import { usePropositionStore } from './propositions';

beforeEach(() => {
  usePropositionStore.getState().reset();
});

describe('usePropositionStore', () => {
  it('starts a first round with no refinements', async () => {
    await usePropositionStore.getState().start('anime');
    const state = usePropositionStore.getState();
    expect(state.status).toBe('success');
    expect(state.brief).toBe('anime');
    expect(state.refinements).toEqual([]);
    expect(state.round?.options.length).toBeGreaterThan(0);
  });

  it('accumulates the descriptor and runs another round when picking', async () => {
    const store = usePropositionStore.getState();
    await store.start('anime');
    const option = usePropositionStore.getState().round!.options[0]!;
    await usePropositionStore.getState().pick(option);
    expect(usePropositionStore.getState().refinements).toEqual([option.descriptor]);
    expect(usePropositionStore.getState().status).toBe('success');
  });

  it('sets error status when the request fails', async () => {
    server.use(http.post('/api/propose', () => new HttpResponse(null, { status: 500 })));
    await usePropositionStore.getState().start('anime');
    expect(usePropositionStore.getState().status).toBe('error');
  });

  it('reset clears the round and refinements', async () => {
    await usePropositionStore.getState().start('anime');
    usePropositionStore.getState().reset();
    const state = usePropositionStore.getState();
    expect(state.round).toBeNull();
    expect(state.refinements).toEqual([]);
    expect(state.status).toBe('idle');
  });
});
