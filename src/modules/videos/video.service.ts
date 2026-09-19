import { Channel } from '../channels/channel.model.js';
import { Video } from './video.model.js';
import { AppError } from '../../middleware/errorHandler.js';

export class VideoService {
  // Channel operations
  async createChannel(name: string, youtubeChannelId: string | undefined, youtubePlaylistId: string | undefined, subjectId: string, addedBy: string, board?: string) {
    if (!youtubeChannelId && !youtubePlaylistId) {
      throw new AppError('Either youtubeChannelId or youtubePlaylistId is required', 400, 'VALIDATION_ERROR');
    }
    if (youtubeChannelId) {
      const existing = await Channel.findOne({ youtubeChannelId });
      if (existing) {
        throw new AppError('Channel already exists', 409, 'CONFLICT');
      }
    }
    if (youtubePlaylistId) {
      const existing = await Channel.findOne({ youtubePlaylistId });
      if (existing) {
        throw new AppError('Playlist already exists', 409, 'CONFLICT');
      }
    }

    return Channel.create({
      name,
      youtubeChannelId,
      youtubePlaylistId,
      subject: subjectId,
      board,
      addedBy,
    });
  }

  async getChannels(subjectId?: string, page: number = 1, limit: number = 20) {
    const filter = subjectId ? { subject: subjectId } : {};
    const skip = (page - 1) * limit;
    const [channels, total] = await Promise.all([
      Channel.find(filter).populate('subject', 'name').skip(skip).limit(limit).sort({ name: 1 }),
      Channel.countDocuments(filter),
    ]);
    return { channels, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getChannelById(id: string) {
    const channel = await Channel.findById(id).populate('subject', 'name');
    if (!channel) {
      throw new AppError('Channel not found', 404, 'NOT_FOUND');
    }
    return channel;
  }

  async updateChannel(id: string, data: { name?: string; subject?: string; isApproved?: boolean; youtubeChannelId?: string; youtubePlaylistId?: string; board?: string }) {
    const channel = await Channel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!channel) {
      throw new AppError('Channel not found', 404, 'NOT_FOUND');
    }
    return channel;
  }

  async deleteChannel(id: string) {
    const channel = await Channel.findByIdAndDelete(id);
    if (!channel) {
      throw new AppError('Channel not found', 404, 'NOT_FOUND');
    }
    // Delete related videos
    await Video.deleteMany({ channel: id });
    return { message: 'Channel deleted successfully' };
  }

  async approveChannel(id: string) {
    const channel = await Channel.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );
    if (!channel) {
      throw new AppError('Channel not found', 404, 'NOT_FOUND');
    }
    return channel;
  }

  // Video operations
  async createVideo(data: {
    youtubeVideoId: string;
    title: string;
    topicId: string;
    channelId: string;
    transcript?: string;
    duration?: number;
    thumbnailUrl?: string;
    addedBy: string;
  }) {
    const existing = await Video.findOne({ youtubeVideoId: data.youtubeVideoId });
    if (existing) {
      throw new AppError('Video already exists', 409, 'CONFLICT');
    }

    return Video.create({
      youtubeVideoId: data.youtubeVideoId,
      title: data.title,
      topic: data.topicId,
      channel: data.channelId,
      transcript: data.transcript,
      duration: data.duration,
      thumbnailUrl: data.thumbnailUrl,
      addedBy: data.addedBy,
    });
  }

  async getVideos(topicId?: string, channelId?: string, subjectId?: string, page: number = 1, limit: number = 20) {
    const filter: any = { isApproved: true };
    if (topicId) filter.topic = topicId;
    if (channelId) filter.channel = channelId;
    if (subjectId) {
      // Get channels for this subject
      const channels = await Channel.find({ subject: subjectId });
      filter.channel = { $in: channels.map(c => c._id) };
    }

    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate('topic', 'name')
        .populate('channel', 'name youtubeChannelId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Video.countDocuments(filter),
    ]);
    return { videos, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getVideoById(id: string, includeTranscript: boolean = false) {
    const query = Video.findById(id)
      .populate('topic', 'name')
      .populate('channel', 'name youtubeChannelId');
    
    if (includeTranscript) {
      query.select('+transcript');
    }

    const video = await query;
    if (!video) {
      throw new AppError('Video not found', 404, 'NOT_FOUND');
    }
    return video;
  }

  async getVideoTranscript(id: string) {
    const video = await Video.findById(id).select('+transcript');
    if (!video) {
      throw new AppError('Video not found', 404, 'NOT_FOUND');
    }
    return { transcript: video.transcript || null };
  }

  async updateVideo(id: string, data: { title?: string; topic?: string; transcript?: string; isApproved?: boolean }) {
    const video = await Video.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!video) {
      throw new AppError('Video not found', 404, 'NOT_FOUND');
    }
    return video;
  }

  async deleteVideo(id: string) {
    const video = await Video.findByIdAndDelete(id);
    if (!video) {
      throw new AppError('Video not found', 404, 'NOT_FOUND');
    }
    return { message: 'Video deleted successfully' };
  }

  async approveVideo(id: string) {
    const video = await Video.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );
    if (!video) {
      throw new AppError('Video not found', 404, 'NOT_FOUND');
    }
    return video;
  }

  // Get videos for student (only approved)
  async getVideosForStudent(topicId: string) {
    const videos = await Video.find({ topic: topicId, isApproved: true })
      .populate('channel', 'name youtubeChannelId')
      .select('-transcript')
      .sort({ createdAt: -1 });
    
    return videos;
  }

  // Search videos - channel first, then YouTube fallback
  async searchVideos(query: string, subjectId?: string, classGrade?: number) {
    const { youtubeService } = await import('../../services/youtube.service.js');

    // Get channels for this subject
    let channelIds: string[] = [];
    if (subjectId) {
      const channels = await Channel.find({ subject: subjectId, isApproved: true })
        .select('youtubeChannelId')
        .limit(5);
      channelIds = channels
        .map((c: any) => c.youtubeChannelId)
        .filter((id: string) => id && id.startsWith('UC'));
    }

    // Step 1: Search within channel videos
    let channelVideos: any[] = [];
    for (const chId of channelIds) {
      const videos = await youtubeService.getChannelPageVideos(chId, 50);
      channelVideos.push(...videos);
    }

    // Step 2: Filter channel videos by class level
    if (classGrade && channelVideos.length > 0) {
      const classPatterns = [
        new RegExp(`class\\s*${classGrade}`, 'i'),
        new RegExp(`${classGrade}(?:th|st|nd|rd)\\s*class`, 'i'),
        new RegExp(`${classGrade}(?:th|st|nd|rd)`, 'i'),
      ];
      const classVideos = channelVideos.filter(v =>
        classPatterns.some(p => p.test(v.title))
      );
      // Use class-filtered videos if we have matches, otherwise keep all
      if (classVideos.length > 0) {
        channelVideos = classVideos;
      }
    }

    // Step 3: Use AI to match query against channel videos
    if (channelVideos.length > 0) {
      const { aiService } = await import('../../services/ai.service.js');
      const videoList = channelVideos.map((v, i) => `${i + 1}. [ID:${i}] ${v.title}`).join('\n');
      const classHint = classGrade ? ` (for class ${classGrade})` : '';

      const prompt = `Student question: "${query}"${classHint}

Available videos from the student's channel:
${videoList}

Return ONLY a JSON array of indices (numbers) of the top 10 most relevant videos, most relevant first. If none are relevant, return [].`;

      try {
        const response = await aiService['chat']([{ role: 'user', content: prompt }]);
        const match = response.match(/\[[\s\S]*?\]/);
        if (match) {
          const indices: number[] = JSON.parse(match[0]);
          const matched = indices.map(i => channelVideos[i]).filter(Boolean);
          if (matched.length > 0) return matched;
        }
      } catch { /* fallback */ }
    }

    // Step 4: Fallback to broad YouTube search with class level
    const searchQuery = classGrade ? `${query} class ${classGrade}` : query;
    const ytVideos = await youtubeService.searchYouTube(searchQuery, undefined, 20);
    return ytVideos;
  }

  // Auto-fetch videos from YouTube
  async fetchVideosFromYouTube(channelId: string, topicId: string | undefined, maxResults: number, addedBy: string) {
    const { youtubeService } = await import('../../services/youtube.service.js');
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new AppError('Channel not found', 404, 'NOT_FOUND');
    }

    let youtubeVideos;
    if (channel.youtubePlaylistId) {
      youtubeVideos = await youtubeService.getPlaylistVideos(channel.youtubePlaylistId, maxResults);
    } else if (channel.youtubeChannelId) {
      youtubeVideos = await youtubeService.getChannelVideos(channel.youtubeChannelId, maxResults);
    } else {
      throw new AppError('Channel has no YouTube ID configured', 400, 'VALIDATION_ERROR');
    }

    let created = 0;
    let skipped = 0;

    for (const ytVideo of youtubeVideos) {
      const existing = await Video.findOne({ youtubeVideoId: ytVideo.youtubeVideoId });
      if (existing) {
        skipped++;
        continue;
      }

      await Video.create({
        youtubeVideoId: ytVideo.youtubeVideoId,
        title: ytVideo.title,
        topic: topicId || undefined,
        channel: channelId,
        thumbnailUrl: ytVideo.thumbnailUrl,
        isApproved: true,
        addedBy,
      });
      created++;
    }

    return { created, skipped, total: youtubeVideos.length };
  }

  // Resolve YouTube URL to ID
  async resolveYouTubeUrl(url: string) {
    const { youtubeService } = await import('../../services/youtube.service.js');
    const result = await youtubeService.extractIdFromUrl(url);

    try {
      if (result.type === 'channel') {
        const info = await youtubeService.getChannelInfo(result.id);
        return { type: 'channel', id: result.id, name: info.title };
      } else {
        const info = await youtubeService.getPlaylistInfo(result.id);
        return { type: 'playlist', id: result.id, name: info.title };
      }
    } catch {
      return { type: result.type, id: result.id, name: result.type === 'channel' ? 'YouTube Channel' : 'YouTube Playlist' };
    }
  }
}

export const videoService = new VideoService();
