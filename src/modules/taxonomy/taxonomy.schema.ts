import { z } from 'zod';

// Board schemas
export const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100),
  code: z.string().min(1, 'Board code is required').max(30).toUpperCase(),
  country: z.string().default('Pakistan'),
  province: z.string().default('Punjab'),
  districts: z.array(z.string()).default([]),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(30).toUpperCase().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  districts: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Class schemas
export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(50),
  board: z.string().min(1, 'Board ID is required'),
  grade: z.number().min(1).max(12),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  board: z.string().optional(),
  grade: z.number().min(1).max(12).optional(),
  isActive: z.boolean().optional(),
});

// Subject schemas
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  class: z.string().min(1, 'Class ID is required'),
  code: z.string().max(20).optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  class: z.string().optional(),
  code: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

// Topic schemas
export const createTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required').max(200),
  subject: z.string().min(1, 'Subject ID is required'),
  description: z.string().max(500).optional(),
  order: z.number().optional(),
});

export const updateTopicSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().optional(),
  description: z.string().max(500).optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

// Query schemas
export const getTaxonomyQuerySchema = z.object({
  board: z.string().optional(),
  class: z.string().optional(),
  subject: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
