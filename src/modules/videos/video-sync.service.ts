import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '@database/database.module';
import { eq } from 'drizzle-orm';
import * as schema from '@database/schemas';
import { RoomsService } from '@modules/rooms/rooms.service';

type SyncMode = 'independent' | 'synchronized';

@Injectable()
export class VideoSyncService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: Database,
    private roomsService: RoomsService,
  ) {}

  async initializeSyncState(roomId: string) {
    const existing = await this.db.query.videoSyncState.findFirst({
      where: eq(schema.videoSyncState.roomId, roomId),
    });

    if (existing) {
      return existing;
    }

    const [state] = await this.db
      .insert(schema.videoSyncState)
      .values({
        roomId,
        mode: 'independent',
        currentTime: 0,
        isPlaying: false,
      })
      .returning();

    return state;
  }

  async getSyncState(roomId: string) {
    const state = await this.db.query.videoSyncState.findFirst({
      where: eq(schema.videoSyncState.roomId, roomId),
    });

    if (!state) {
      return this.initializeSyncState(roomId);
    }

    return state;
  }

  async updateSyncState(
    roomId: string,
    userId: string,
    updates: {
      mode?: SyncMode;
      currentTime?: number;
      isPlaying?: boolean;
    },
  ) {
    const role = await this.roomsService.getParticipantRole(roomId, userId);

    if (!['owner', 'admin'].includes(role || '')) {
      throw new ForbiddenException('Only room admins can control video sync');
    }

    const [updated] = await this.db
      .update(schema.videoSyncState)
      .set({
        ...updates,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.videoSyncState.roomId, roomId))
      .returning();

    return updated;
  }

  async enableSync(roomId: string, userId: string, time: number) {
    return this.updateSyncState(roomId, userId, {
      mode: 'synchronized',
      currentTime: time,
      isPlaying: false,
    });
  }

  async disableSync(roomId: string, userId: string) {
    return this.updateSyncState(roomId, userId, {
      mode: 'independent',
    });
  }

  async updatePlayState(roomId: string, userId: string, isPlaying: boolean, currentTime?: number) {
    const state = await this.getSyncState(roomId);

    if (state.mode === 'independent') {
      return state;
    }

    const updates: any = { isPlaying };
    if (currentTime !== undefined) {
      updates.currentTime = currentTime;
    }

    return this.updateSyncState(roomId, userId, updates);
  }

  async seekTo(roomId: string, userId: string, time: number) {
    const state = await this.getSyncState(roomId);

    if (state.mode === 'independent') {
      return state;
    }

    return this.updateSyncState(roomId, userId, {
      currentTime: time,
    });
  }
}
