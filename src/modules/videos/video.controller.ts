import { Request, Response, NextFunction } from 'express';
import { videoService } from './video.service.js';

export class VideoController {
  // Channel operations
  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, youtubeChannelId, youtubePlaylistId, subject, board } = req.body;
      const channel = await videoService.createChannel(name, youtubeChannelId, youtubePlaylistId, subject, req.user!.userId, board);
      res.status(201).json({ success: true, data: channel });
    } catch (error) {
      next(error);
    }
  }

  async getChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, page = 1, limit = 20 } = req.query;
      const result = await videoService.getChannels(subject as string, Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.channels, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }

  async getChannelById(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await videoService.getChannelById(req.params.id as string);
      res.status(200).json({ success: true, data: channel });
    } catch (error) {
      next(error);
    }
  }

  async updateChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await videoService.updateChannel(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: channel });
    } catch (error) {
      next(error);
    }
  }

  async deleteChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await videoService.deleteChannel(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async approveChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await videoService.approveChannel(req.params.id as string);
      res.status(200).json({ success: true, data: channel });
    } catch (error) {
      next(error);
    }
  }

  // Video operations
  async createVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { youtubeVideoId, title, topic, channel, transcript, duration, thumbnailUrl } = req.body;
      const video = await videoService.createVideo({
        youtubeVideoId,
        title,
        topicId: topic,
        channelId: channel,
        transcript,
        duration,
        thumbnailUrl,
        addedBy: req.user!.userId,
      });
      res.status(201).json({ success: true, data: video });
    } catch (error) {
      next(error);
    }
  }

  async getVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic, channel, subject, page = 1, limit = 20 } = req.query;
      const result = await videoService.getVideos(topic as string, channel as string, subject as string, Number(page), Number(limit));
      res.status(200).json({ success: true, data: result.videos, pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      next(error);
    }
  }

  async getVideoById(req: Request, res: Response, next: NextFunction) {
    try {
      const video = await videoService.getVideoById(req.params.id as string);
      res.status(200).json({ success: true, data: video });
    } catch (error) {
      next(error);
    }
  }

  async getVideoTranscript(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await videoService.getVideoTranscript(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const video = await videoService.updateVideo(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: video });
    } catch (error) {
      next(error);
    }
  }

  async deleteVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await videoService.deleteVideo(req.params.id as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async approveVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const video = await videoService.approveVideo(req.params.id as string);
      res.status(200).json({ success: true, data: video });
    } catch (error) {
      next(error);
    }
  }

  // Student endpoints
  async getVideosForStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const topicId = req.params.topicId as string;
      const videos = await videoService.getVideosForStudent(topicId);
      res.status(200).json({ success: true, data: videos });
    } catch (error) {
      next(error);
    }
  }

  // Search videos by text
  async searchVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, subject, grade } = req.query;
      const videos = await videoService.searchVideos(q as string, subject as string, grade ? Number(grade) : undefined);
      res.status(200).json({ success: true, data: videos });
    } catch (error) {
      next(error);
    }
  }

  // Auto-fetch videos from YouTube
  async fetchVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId, topicId, maxResults } = req.body;
      const result = await videoService.fetchVideosFromYouTube(channelId, topicId, maxResults || 50, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Resolve YouTube URL to channel/playlist ID
  async resolveUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      const result = await videoService.resolveYouTubeUrl(url);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const videoController = new VideoController();
