import { z } from 'zod';

// Normalized progress events streamed (via SSE) while an agent CLI works on a discovery — so the UI
// can show what it is thinking / searching instead of a bare spinner. Provider-neutral.
export const AgentStreamEventSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('status'), text: z.string() }),
  z.object({ kind: z.literal('reasoning'), text: z.string() }),
  z.object({ kind: z.literal('search'), query: z.string() }),
  z.object({ kind: z.literal('tool'), name: z.string() }),
]);

export type AgentStreamEvent = z.infer<typeof AgentStreamEventSchema>;
