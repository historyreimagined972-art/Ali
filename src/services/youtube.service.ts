import { env } from '../config/env.js';

interface YouTubeVideo {
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  channelName?: string;
  duration?: number;
}

interface YouTubePlaylistItem {
  id: string;
  snippet: {
    title: string;
    resourceId: { videoId: string };
    thumbnails: { default?: { url: string }; medium?: { url: string }; high?: { url: string } };
  };
  contentDetails: { videoId: string };
}

interface YouTubeChannelResponse {
  items: {
    id: string;
    contentDetails: {
      relatedPlaylists: { uploads: string };
    };
  }[];
}

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
  pageInfo: { totalResults: number };
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = env.YOUTUBE_API_KEY || '';
  }

  private async get<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('key', this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube API error: ${res.status} - ${err}`);
    }
    return res.json() as Promise<T>;
  }

  async getChannelUploadsPlaylist(channelId: string): Promise<string> {
    const data = await this.get<YouTubeChannelResponse>('/channels', {
      part: 'contentDetails',
      id: channelId,
    });

    if (!data.items?.length) {
      throw new Error('Channel not found');
    }

    return data.items[0].contentDetails.relatedPlaylists.uploads;
  }

  async getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    const videos: YouTubeVideo[] = [];
    let pageToken: string | undefined;

    do {
      const params: Record<string, string> = {
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: String(Math.min(maxResults - videos.length, 50)),
      };
      if (pageToken) params.pageToken = pageToken;

      const data = await this.get<YouTubePlaylistResponse>('/playlistItems', params);

      for (const item of data.items) {
        const snippet = item.snippet;
        const videoId = snippet.resourceId?.videoId || item.contentDetails?.videoId;
        if (!videoId) continue;

        const thumbnails = snippet.thumbnails;
        const thumbnailUrl = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';

        videos.push({
          youtubeVideoId: videoId,
          title: snippet.title,
          thumbnailUrl,
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken && videos.length < maxResults);

    return videos.slice(0, maxResults);
  }

  async getChannelVideos(channelId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      const uploadsPlaylistId = await this.getChannelUploadsPlaylist(channelId);
      return this.getPlaylistVideos(uploadsPlaylistId, maxResults);
    } catch {
      // API blocked — fallback to RSS feed
      return this.getChannelVideosFromRSS(channelId, maxResults);
    }
  }

  async getChannelVideosFromRSS(channelId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    // Try RSS first
    try {
      const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
      if (res.ok) {
        const xml = await res.text();
        const videos: YouTubeVideo[] = [];
        const entries = xml.split('<entry>').slice(1);
        for (const entry of entries.slice(0, maxResults)) {
          const titleMatch = entry.match(/<title>(.*?)<\/title>/);
          const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
          const thumbMatch = entry.match(/<media:thumbnail url="(.*?)"/);
          if (idMatch) {
            videos.push({
              youtubeVideoId: idMatch[1],
              title: titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : 'Untitled',
              thumbnailUrl: thumbMatch ? thumbMatch[1] : '',
            });
          }
        }
        if (videos.length > 0) return videos;
      }
    } catch { /* fallback to scraping */ }

    // Fallback: scrape channel page for video IDs, then get titles via oembed
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/videos`);
    if (!res.ok) throw new Error('Could not fetch channel page');
    const html = await res.text();

    const videoIds: string[] = [];
    const seen = new Set<string>();
    const regex = /"videoId":"([\w-]{11})"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        videoIds.push(match[1]);
      }
      if (videoIds.length >= maxResults) break;
    }

    // Get titles via oembed (batch, up to 10 concurrent)
    const videos: YouTubeVideo[] = [];
    for (let i = 0; i < videoIds.length; i += 10) {
      const batch = videoIds.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(async (id) => {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
          if (oembedRes.ok) {
            const data = await oembedRes.json() as any;
            return { youtubeVideoId: id, title: data.title || 'Untitled Video', thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
          }
          return { youtubeVideoId: id, title: 'Untitled Video', thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') videos.push(r.value);
      }
    }

    return videos;
  }

  async getPlaylistInfo(playlistId: string): Promise<{ title: string; itemCount: number }> {
    const data = await this.get<{ items: { snippet: { title: string } }[]; pageInfo: { totalResults: number } }>('/playlists', {
      part: 'snippet,contentDetails',
      id: playlistId,
    });

    if (!data.items?.length) {
      throw new Error('Playlist not found');
    }

    return {
      title: data.items[0].snippet.title,
      itemCount: data.pageInfo?.totalResults || 0,
    };
  }

  async getChannelInfo(channelId: string): Promise<{ title: string }> {
    const data = await this.get<{ items: { snippet: { title: string } }[] }>('/channels', {
      part: 'snippet',
      id: channelId,
    });

    if (!data.items?.length) {
      throw new Error('Channel not found');
    }

    return { title: data.items[0].snippet.title };
  }

  async searchYouTube(query: string, channelId?: string, maxResults: number = 20): Promise<YouTubeVideo[]> {
    let searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error('Could not search YouTube');

    const html = await res.text();

    const dataMatch = html.match(/var ytInitialData = (\{.*?\});\s*<\/script>/s);
    if (!dataMatch) return [];

    try {
      const data = JSON.parse(dataMatch[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

      const videos: YouTubeVideo[] = [];
      for (const item of contents) {
        const renderer = item.videoRenderer;
        if (!renderer) continue;

        const id = renderer.videoId;
        const title = renderer.title?.runs?.map((r: any) => r.text).join('') || '';
        const thumbnail = renderer.thumbnail?.thumbnails?.pop()?.url || '';
        const channelName = renderer.ownerText?.runs?.[0]?.text || '';

        videos.push({
          youtubeVideoId: id,
          title,
          thumbnailUrl: thumbnail,
          channelName,
        });

        if (videos.length >= maxResults) break;
      }

      return videos;
    } catch {
      return [];
    }
  }

  // Get videos from a specific channel page
  async getChannelPageVideos(channelId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      const res = await fetch(`https://www.youtube.com/channel/${channelId}/videos`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!res.ok) return [];

      const html = await res.text();
      const videoIds: string[] = [];
      const seen = new Set<string>();
      const regex = /"videoId":"([\w-]{11})"/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (!seen.has(match[1])) {
          seen.add(match[1]);
          videoIds.push(match[1]);
        }
        if (videoIds.length >= maxResults) break;
      }

      // Get titles via oembed (batch)
      const videos: YouTubeVideo[] = [];
      for (let i = 0; i < videoIds.length; i += 10) {
        const batch = videoIds.slice(i, i + 10);
        const results = await Promise.allSettled(
          batch.map(async (id) => {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
            if (oembedRes.ok) {
              const data = await oembedRes.json() as any;
              return { youtubeVideoId: id, title: data.title || 'Untitled', thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, channelName: data.author_name || '' };
            }
            return { youtubeVideoId: id, title: 'Untitled', thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, channelName: '' };
          })
        );
        for (const r of results) {
          if (r.status === 'fulfilled') videos.push(r.value);
        }
      }
      return videos;
    } catch {
      return [];
    }
  }

  async extractIdFromUrl(url: string): Promise<{ type: 'channel' | 'playlist'; id: string }> {
    // Playlist URLs: https://www.youtube.com/playlist?list=PLxxxxx
    if (url.includes('list=')) {
      const id = url.split('list=')[1]?.split(/[?#/&]/)[0];
      if (id) return { type: 'playlist', id };
    }

    // Channel URLs: https://www.youtube.com/channel/UCxxxxx
    if (url.includes('/channel/')) {
      const id = url.split('/channel/')[1]?.split(/[?#/]/)[0];
      if (id) return { type: 'channel', id };
    }

    // Handle URLs: https://www.youtube.com/@username
    const handleMatch = url.match(/youtube\.com\/@([\w.-]+)/);
    if (handleMatch) {
      const handle = handleMatch[1];
      try {
        const data = await this.get<{ items: { id: string }[] }>('/channels', {
          part: 'id',
          forHandle: handle,
        });
        if (data.items?.length) {
          return { type: 'channel', id: data.items[0].id };
        }
      } catch {
        // API blocked — fallback to page scraping
      }

      // Fallback: scrape channel page for externalId
      try {
        const res = await fetch(`https://www.youtube.com/@${handle}`);
        const html = await res.text();
        const match = html.match(/"externalId":"(UC[\w-]{22})"/);
        if (match) return { type: 'channel', id: match[1] };
      } catch {
        // ignore
      }

      throw new Error('Could not resolve YouTube handle. Please use the full channel URL (youtube.com/channel/UCxxxxx) instead.');
    }

    // Short URLs: https://youtu.be/xxxxx
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?#/]/)[0];
      if (id) return { type: 'channel', id };
    }

    // Already an ID (no URL structure)
    if (/^UC[\w-]{22}$/.test(url)) return { type: 'channel', id: url };
    if (/^PL[\w-]{32,}$/.test(url)) return { type: 'playlist', id: url };

    throw new Error('Could not extract channel or playlist ID from the provided URL');
  }
}

export const youtubeService = new YouTubeService();
