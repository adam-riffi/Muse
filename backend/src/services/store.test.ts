import { describe, expect, it } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { createSessionStore } from './store.js';

function candidate(id: string, url: string): ImageCandidate {
  return { id, source: 'codex:websearch', url, rationale: 'r' };
}

describe('createSessionStore', () => {
  it('stores and retrieves candidates by id', () => {
    const store = createSessionStore();
    store.putCandidates([candidate('a', 'https://x.com/a.jpg')]);
    expect(store.getCandidate('a')?.url).toBe('https://x.com/a.jpg');
    expect(store.getCandidate('missing')).toBeUndefined();
  });

  it('upserts candidates with the same id', () => {
    const store = createSessionStore();
    store.putCandidates([candidate('a', 'https://x.com/a.jpg')]);
    store.putCandidates([candidate('a', 'https://x.com/updated.jpg')]);
    expect(store.size()).toBe(1);
    expect(store.getCandidate('a')?.url).toBe('https://x.com/updated.jpg');
  });

  it('resolves a subset of ids, skipping missing ones and preserving order', () => {
    const store = createSessionStore();
    store.putCandidates([
      candidate('a', 'https://x.com/a.jpg'),
      candidate('b', 'https://x.com/b.jpg'),
      candidate('c', 'https://x.com/c.jpg'),
    ]);
    expect(store.getCandidates(['c', 'missing', 'a']).map((entry) => entry.id)).toEqual(['c', 'a']);
  });

  it('returns all candidates and clears them', () => {
    const store = createSessionStore();
    store.putCandidates([
      candidate('a', 'https://x.com/a.jpg'),
      candidate('b', 'https://x.com/b.jpg'),
    ]);
    expect(store.allCandidates()).toHaveLength(2);
    store.clear();
    expect(store.size()).toBe(0);
  });

  it('stores and clears the board', () => {
    const store = createSessionStore();
    expect(store.getBoard()).toBeNull();
    store.setBoard({ elements: [], viewport: { x: 0, y: 0, zoom: 1 } });
    expect(store.getBoard()).not.toBeNull();
    store.clear();
    expect(store.getBoard()).toBeNull();
  });
});
