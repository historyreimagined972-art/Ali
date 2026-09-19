import { z } from 'zod';

export const generateTestSchema = z.object({
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numQuestions: z.number().min(1).max(50).default(10),
  questionTypes: z.array(z.enum(['mcq', 'short', 'long'])).default(['mcq']),
  board: z.string().optional(),
  classLevel: z.string().optional(),
  subject: z.string().optional(),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  answers: z.array(z.object({
    questionNumber: z.number(),
    type: z.enum(['mcq', 'short', 'long']),
    studentAnswer: z.string(),
  })),
});

export const gradeAttemptSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
});

export type GenerateTestInput = z.infer<typeof generateTestSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
