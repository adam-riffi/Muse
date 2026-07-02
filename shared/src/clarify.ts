import { z } from 'zod';

// A single clarifying question the intake agent asks to narrow the visual direction before searching.
export const ClarifyQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  hint: z.string().optional(),
});
export type ClarifyQuestion = z.infer<typeof ClarifyQuestionSchema>;

export const ClarifyResultSchema = z.object({
  questions: z.array(ClarifyQuestionSchema),
});
export type ClarifyResult = z.infer<typeof ClarifyResultSchema>;

export const ClarifyInputSchema = z.object({
  brief: z.string().min(1),
  count: z.number().int().positive().max(6).optional(),
});
export type ClarifyInput = z.infer<typeof ClarifyInputSchema>;
