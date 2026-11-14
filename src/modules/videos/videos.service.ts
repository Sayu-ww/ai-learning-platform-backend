import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '@database/database.module';
import { eq, and } from 'drizzle-orm';
import * as schema from '@database/schemas';

@Injectable()
export class VideosService {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async addVideo(
    addedBy: string,
    data: {
      source: 'youtube' | 'vimeo' | 'rutube' | 'archive';
      externalId: string;
      title?: string;
      description?: string;
      duration?: number;
      thumbnailUrl?: string;
    },
  ) {
    const existing = await this.db.query.videos.findFirst({
      where: and(eq(schema.videos.source, data.source), eq(schema.videos.externalId, data.externalId)),
    });

    if (existing) {
      return existing;
    }

    const metadata = await this.fetchMetadata(data.source, data.externalId);

    const [video] = await this.db
      .insert(schema.videos)
      .values({
        source: data.source,
        externalId: data.externalId,
        title: data.title || metadata.title || 'Untitled',
        description: data.description || metadata.description,
        duration: data.duration || metadata.duration,
        thumbnailUrl: data.thumbnailUrl || metadata.thumbnailUrl,
        metadata: metadata.raw || {},
        addedBy,
      })
      .returning();

    return video;
  }

  async findById(videoId: string) {
    const video = await this.db.query.videos.findFirst({
      where: eq(schema.videos.id, videoId),
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async searchVideos(query: string, limit = 20) {
    // Basic search - will be enhanced with full-text search later
    return [];
  }

  private async fetchMetadata(source: string, externalId: string) {
    switch (source) {
      case 'youtube':
        return this.fetchYouTubeMetadata(externalId);
      case 'vimeo':
        return this.fetchVimeoMetadata(externalId);
      case 'rutube':
        return this.fetchRuTubeMetadata(externalId);
      case 'archive':
        return this.fetchArchiveMetadata(externalId);
      default:
        return { title: '', description: '', duration: 0, thumbnailUrl: '', raw: {} };
    }
  }

  private async fetchYouTubeMetadata(videoId: string) {
    // TODO: Implement YouTube Data API v3 integration
    // For now return basic structure
    return {
      title: `YouTube Video ${videoId}`,
      description: '',
      duration: 0,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      raw: { videoId },
    };
  }

  private async fetchVimeoMetadata(videoId: string) {
    // TODO: Implement Vimeo API integration
    return {
      title: `Vimeo Video ${videoId}`,
      description: '',
      duration: 0,
      thumbnailUrl: '',
      raw: { videoId },
    };
  }

  private async fetchRuTubeMetadata(videoId: string) {
    // TODO: Implement RuTube API integration
    return {
      title: `RuTube Video ${videoId}`,
      description: '',
      duration: 0,
      thumbnailUrl: '',
      raw: { videoId },
    };
  }

  private async fetchArchiveMetadata(itemId: string) {
    // TODO: Implement Internet Archive API integration
    return {
      title: `Archive Item ${itemId}`,
      description: '',
      duration: 0,
      thumbnailUrl: '',
      raw: { itemId },
    };
  }
}
