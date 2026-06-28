import { describe, expect, it, vi } from 'vitest';
import { streamDiscover } from './client';

class FakeEventSource {
  url: string;
  private listeners: Record<string, ((e: { data: string }) => void)[]> = {};
  onerror: ((e: unknown) => void) | null = null;
  closed = false;
  constructor(url: string) {
    this.url = url;
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

function makeFactory() {
  let instance: FakeEventSource | undefined;
  const factory = (url: string): FakeEventSource => {
    instance = new FakeEventSource(url);
    return instance;
  };
  return { factory, get: () => instance as FakeEventSource };
}

describe('streamDiscover', () => {
  it('builds the stream URL and forwards activity then result, then closes', () => {
    const { factory, get } = makeFactory();
    const onActivity = vi.fn();
    const onResult = vi.fn();
    const onFailure = vi.fn();

    streamDiscover(
      { brief: 'cozy nook', count: 6, refinements: ['ghibli'] },
      { onActivity, onResult, onFailure },
      factory,
    );
    const es = get();
    expect(es.url).toContain('/api/discover/stream?');
    expect(es.url).toContain('brief=cozy+nook');
    expect(es.url).toContain('count=6');
    expect(es.url).toContain('refinements=');

    es.emit('activity', { kind: 'reasoning', text: 'thinking' });
    es.emit('result', [
      { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits' },
    ]);

    expect(onActivity).toHaveBeenCalledWith({ kind: 'reasoning', text: 'thinking' });
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();
    expect(es.closed).toBe(true);
  });

  it('reports failures from the failed event', () => {
    const { factory, get } = makeFactory();
    const onFailure = vi.fn();
    streamDiscover({ brief: 'x' }, { onActivity: vi.fn(), onResult: vi.fn(), onFailure }, factory);
    get().emit('failed', { message: 'boom' });
    expect(onFailure).toHaveBeenCalledWith('boom');
    expect(get().closed).toBe(true);
  });
});
