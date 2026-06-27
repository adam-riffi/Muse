import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../test/msw/server';
import { useCandidateStore } from './candidates';

beforeEach(() => {
  useCandidateStore.getState().reset();
});

describe('useCandidateStore', () => {
  it('starts idle with no candidates', () => {
    const state = useCandidateStore.getState();
    expect(state.status).toBe('idle');
    expect(state.candidates).toHaveLength(0);
  });

  it('runs discovery and stores candidates on success', async () => {
    await useCandidateStore.getState().runDiscovery({ brief: 'cozy y2k bedroom' });
    const state = useCandidateStore.getState();
    expect(state.status).toBe('success');
    expect(state.candidates).toHaveLength(1);
    expect(state.lastBrief).toBe('cozy y2k bedroom');
    expect(state.error).toBeNull();
  });

  it('sets error status when the request fails', async () => {
    server.use(http.post('/api/discover', () => new HttpResponse(null, { status: 500 })));
    await useCandidateStore.getState().runDiscovery({ brief: 'x' });
    const state = useCandidateStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).not.toBeNull();
    expect(state.candidates).toHaveLength(0);
  });
});
