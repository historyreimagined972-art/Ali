import { z } from 'zod';

export const uploadPastPaperSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  board: z.string().min(1, 'Board ID is required'),
  class: z.string().min(1, 'Class ID is required'),
  subject: z.string().min(1, 'Subject ID is required'),
  year: z.number().min(2000).max(new Date().getFullYear() + 1),
});

export const updatePastPaperSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  board: z.string().optional(),
  class: z.string().optional(),
  subject: z.string().optional(),
  year: z.number().min(2000).max(new Date().getFullYear() + 1).optional(),
});

export const getPastPapersQuerySchema = z.object({
  board: z.string().optional(),
  class: z.string().optional(),
  subject: z.string().optional(),
  year: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type UploadPastPaperInput = z.infer<typeof uploadPastPaperSchema>;
export type UpdatePastPaperInput = z.infer<typeof updatePastPaperSchema>;
