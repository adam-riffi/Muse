import { describe, expect, it } from 'vitest';
import { AgentStreamEventSchema } from './stream.js';

describe('AgentStreamEventSchema', () => {
  it('accepts each event kind', () => {
    expect(AgentStreamEventSchema.parse({ kind: 'status', text: 'go' }).kind).toBe('status');
    expect(AgentStreamEventSchema.parse({ kind: 'reasoning', text: 'x' }).kind).toBe('reasoning');
    expect(AgentStreamEventSchema.parse({ kind: 'search', query: 'q' }).kind).toBe('search');
    expect(AgentStreamEventSchema.parse({ kind: 'tool', name: 't' }).kind).toBe('tool');
  });

  it('rejects unknown kinds and missing fields', () => {
    expect(AgentStreamEventSchema.safeParse({ kind: 'nope' }).success).toBe(false);
    expect(AgentStreamEventSchema.safeParse({ kind: 'search' }).success).toBe(false);
  });
});
