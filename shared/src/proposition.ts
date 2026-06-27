import { z } from 'zod';
import { ImageCandidateSchema } from './image-candidate.js';

// One proposed sub-style in a refinement round (e.g. anime → "Ghibli"). `descriptor` is fed back
// into discovery to sharpen the search; `preview` is one representative image for the sub-style.
export const PropositionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  descriptor: z.string().min(1),
  query: z.string().min(1),
  preview: ImageCandidateSchema.optional(),
});

export type PropositionOption = z.infer<typeof PropositionOptionSchema>;

// A round of multiple-choice options. `refinements` are the descriptors accumulated from prior
// rounds; the user picks an option to add its descriptor and (optionally) run another round.
export const PropositionRoundSchema = z.object({
  id: z.string().min(1),
  brief: z.string().min(1),
  refinements: z.array(z.string()),
  options: z.array(PropositionOptionSchema),
});

export type PropositionRound = z.infer<typeof PropositionRoundSchema>;
