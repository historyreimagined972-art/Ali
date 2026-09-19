import { z } from 'zod';

export const askDoubtSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required').max(50000, 'Transcript too long'),
  question: z.string().min(1, 'Question is required').max(1000, 'Question too long'),
});

export type AskDoubtInput = z.infer<typeof askDoubtSchema>;
