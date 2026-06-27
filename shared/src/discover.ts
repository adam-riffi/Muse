import { z } from 'zod';

// The discovery request contract, shared by the frontend client and the backend route.
// `refinements` carries the style descriptors chosen during proposition rounds (Epic 3).
export const DiscoverInputSchema = z.object({
  brief: z.string().min(1),
  count: z.number().int().positive().max(50).optional(),
  refinements: z.array(z.string()).optional(),
});

export type DiscoverInput = z.infer<typeof DiscoverInputSchema>;
