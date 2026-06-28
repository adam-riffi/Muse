import { describe, expect, it } from 'vitest';
import { normalizeCodexEvent, normalizeCopilotEvent, normalizerFor } from './agent-stream.js';

describe('normalizeCodexEvent', () => {
  it('maps a completed web_search to a search event', () => {
    const line = {
      type: 'item.completed',
      item: { id: 'item_0', type: 'web_search', query: 'cozy reading nook' },
    };
    expect(normalizeCodexEvent(line)).toEqual({ kind: 'search', query: 'cozy reading nook' });
  });

  it('maps turn.started to a status event and ignores empty queries', () => {
    expect(normalizeCodexEvent({ type: 'turn.started' })).toEqual({
      kind: 'status',
      text: 'Searching the web…',
    });
    expect(
      normalizeCodexEvent({ type: 'item.completed', item: { type: 'web_search', query: '' } }),
    ).toBeNull();
  });

  it('ignores the final agent_message and unknown events', () => {
    expect(
      normalizeCodexEvent({ type: 'item.completed', item: { type: 'agent_message', text: '[]' } }),
    ).toBeNull();
    expect(normalizeCodexEvent('nope')).toBeNull();
  });
});

describe('normalizeCopilotEvent', () => {
  it('streams reasoning deltas', () => {
    const line = { type: 'assistant.reasoning_delta', data: { deltaContent: 'I will search' } };
    expect(normalizeCopilotEvent(line)).toEqual({ kind: 'reasoning', text: 'I will search' });
  });

  it('maps a web tool execution to a search event with the URL', () => {
    const line = {
      type: 'tool.execution_start',
      data: { toolName: 'web_fetch', arguments: { url: 'https://unsplash.com/s/photos/nook' } },
    };
    expect(normalizeCopilotEvent(line)).toEqual({
      kind: 'search',
      query: 'https://unsplash.com/s/photos/nook',
    });
  });

  it('maps a non-web tool to a tool event and ignores the final message', () => {
    expect(
      normalizeCopilotEvent({ type: 'tool.execution_start', data: { toolName: 'str_replace' } }),
    ).toEqual({ kind: 'tool', name: 'str_replace' });
    expect(
      normalizeCopilotEvent({ type: 'assistant.message', data: { content: '[]' } }),
    ).toBeNull();
  });
});

describe('normalizerFor', () => {
  it('selects the provider normalizer', () => {
    expect(normalizerFor('codex')).toBe(normalizeCodexEvent);
    expect(normalizerFor('copilot')).toBe(normalizeCopilotEvent);
  });
});
