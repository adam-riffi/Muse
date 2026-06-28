import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCandidateStore } from './candidates';

class FakeEventSource {
  static last: FakeEventSource | null = null;
  url: string;
  private listeners: Record<string, ((e: { data: string }) => void)[]> = {};
  onerror: ((e: unknown) => void) | null = null;
  closed = false;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.last = this;
  }
  addEventListener(type: string, cb: (e: { data: string }) => void): void {
    (this.listeners[type] ??= []).push(cb);
  }
  emit(type: string, data: unknown): void {
    for (const cb of this.listeners[type] ?? []) {
      cb({ data: JSON.stringify(data) });
    }
  }
  close(): void {
    this.closed = true;
  }
}

beforeEach(() => {
  useCandidateStore.getState().reset();
  FakeEventSource.last = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runDiscoveryStream', () => {
  it('streams activity (coalescing reasoning) and stores the final candidates', () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    useCandidateStore.getState().runDiscoveryStream({ brief: 'nook' });
    expect(useCandidateStore.getState().status).toBe('loading');

    const es = FakeEventSource.last;
    expect(es).not.toBeNull();
    es!.emit('activity', { kind: 'reasoning', text: 'I ' });
    es!.emit('activity', { kind: 'reasoning', text: 'think' });
    es!.emit('activity', { kind: 'search', query: 'cozy nook' });
    es!.emit('result', [
      { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits' },
    ]);

    const state = useCandidateStore.getState();
    expect(state.status).toBe('success');
    expect(state.candidates).toHaveLength(1);
    expect(state.events.filter((e) => e.kind === 'reasoning')).toEqual([
      { kind: 'reasoning', text: 'I think' },
    ]);
    expect(state.events.some((e) => e.kind === 'search')).toBe(true);
    expect(es!.closed).toBe(true);
  });

  it('falls back to non-streaming discovery when EventSource is unavailable', async () => {
    useCandidateStore.getState().runDiscoveryStream({ brief: 'x' });
    await vi.waitFor(() => {
      expect(useCandidateStore.getState().status).toBe('success');
    });
    expect(useCandidateStore.getState().candidates).toHaveLength(1);
  });
});
