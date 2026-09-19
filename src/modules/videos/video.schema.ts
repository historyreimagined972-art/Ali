import { z } from 'zod';

// Channel schemas
export const createChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').max(200),
  youtubeChannelId: z.string().max(100).optional(),
  youtubePlaylistId: z.string().max(100).optional(),
  subject: z.string().min(1, 'Subject ID is required'),
  board: z.string().max(30).optional(),
}).refine(
  (data) => data.youtubeChannelId || data.youtubePlaylistId,
  { message: 'Either youtubeChannelId or youtubePlaylistId is required' }
);

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  youtubeChannelId: z.string().max(100).optional(),
  youtubePlaylistId: z.string().max(100).optional(),
  subject: z.string().optional(),
  board: z.string().max(30).optional(),
  isApproved: z.boolean().optional(),
});

// Video schemas
export const createVideoSchema = z.object({
  youtubeVideoId: z.string().min(1, 'YouTube video ID is required'),
  title: z.string().min(1, 'Video title is required').max(500),
  topic: z.string().optional(),
  channel: z.string().min(1, 'Channel ID is required'),
  transcript: z.string().optional(),
  duration: z.number().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  topic: z.string().optional(),
  transcript: z.string().optional(),
  isApproved: z.boolean().optional(),
});

// Query schemas
export const getVideosQuerySchema = z.object({
  topic: z.string().optional(),
  channel: z.string().optional(),
  subject: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
