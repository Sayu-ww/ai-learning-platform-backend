import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '@database/database.module';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '@database/schemas';

@Injectable()
export class RoomsService {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async create(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      type: 'public' | 'private';
      isPermanent?: boolean;
    },
  ) {
    const [room] = await this.db
      .insert(schema.rooms)
      .values({
        ...data,
        ownerId,
        isPermanent: data.isPermanent ?? true,
      })
      .returning();

    await this.db.insert(schema.roomParticipants).values({
      roomId: room.id,
      userId: ownerId,
      role: 'owner',
    });

    return room;
  }

  async findById(roomId: string) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.id, roomId),
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async findPublicRooms(limit = 50) {
    const rooms = await this.db.query.rooms.findMany({
      where: eq(schema.rooms.type, 'public'),
      limit,
      orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
    });

    return rooms;
  }

  async findUserRooms(userId: string) {
    const participations = await this.db.query.roomParticipants.findMany({
      where: eq(schema.roomParticipants.userId, userId),
      with: {
        room: true,
      },
    });

    return participations.flatMap((participation) =>
      participation.room ? [{ ...participation.room, userRole: participation.role }] : [],
    );
  }

  async update(
    roomId: string,
    userId: string,
    data: Partial<{ name: string; description: string; type: 'public' | 'private' }>,
  ) {
    await this.checkPermission(roomId, userId, ['owner', 'admin']);

    const [updated] = await this.db
      .update(schema.rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.rooms.id, roomId))
      .returning();

    return updated;
  }

  async delete(roomId: string, userId: string) {
    await this.checkPermission(roomId, userId, ['owner']);

    await this.db.delete(schema.rooms).where(eq(schema.rooms.id, roomId));
  }

  async joinRoom(roomId: string, userId: string) {
    const room = await this.findById(roomId);

    // Проверяем, что комната публичная
    if (room.type === 'private') {
      throw new ForbiddenException('Cannot join private room without invite');
    }

    // Проверяем, не является ли пользователь уже участником
    const existing = await this.db.query.roomParticipants.findFirst({
      where: and(
        eq(schema.roomParticipants.roomId, roomId),
        eq(schema.roomParticipants.userId, userId),
      ),
    });

    if (existing) {
      console.log(`User ${userId} is already a participant of room ${roomId}`);
      return room;
    }

    // Добавляем пользователя как участника
    await this.db.insert(schema.roomParticipants).values({
      roomId,
      userId,
      role: 'participant',
    });

    console.log(`User ${userId} joined room ${roomId} as participant`);

    return room;
  }

  async addParticipant(roomId: string, userId: string, invitedBy: string) {
    await this.checkPermission(roomId, invitedBy, ['owner', 'admin', 'moderator']);

    const existing = await this.db.query.roomParticipants.findFirst({
      where: and(
        eq(schema.roomParticipants.roomId, roomId),
        eq(schema.roomParticipants.userId, userId),
      ),
    });

    if (existing) {
      return existing;
    }

    const [participant] = await this.db
      .insert(schema.roomParticipants)
      .values({
        roomId,
        userId,
        role: 'participant',
      })
      .returning();

    return participant;
  }

  async removeParticipant(roomId: string, userId: string, removedBy: string) {
    if (userId !== removedBy) {
      await this.checkPermission(roomId, removedBy, ['owner', 'admin', 'moderator']);
    }

    await this.db
      .delete(schema.roomParticipants)
      .where(
        and(eq(schema.roomParticipants.roomId, roomId), eq(schema.roomParticipants.userId, userId)),
      );
  }

  async updateParticipantRole(
    roomId: string,
    userId: string,
    newRole: 'admin' | 'moderator' | 'participant',
    updatedBy: string,
  ) {
    await this.checkPermission(roomId, updatedBy, ['owner']);

    const [updated] = await this.db
      .update(schema.roomParticipants)
      .set({ role: newRole })
      .where(
        and(eq(schema.roomParticipants.roomId, roomId), eq(schema.roomParticipants.userId, userId)),
      )
      .returning();

    return updated;
  }

  async getParticipants(roomId: string) {
    const participants = await this.db.query.roomParticipants.findMany({
      where: eq(schema.roomParticipants.roomId, roomId),
      with: {
        user: {
          with: {
            profile: true,
          },
        },
      },
    });

    return participants.flatMap((participant) => {
      if (!participant.user) {
        return [];
      }

      return [
        {
          id: participant.id,
          userId: participant.userId,
          role: participant.role,
          joinedAt: participant.joinedAt,
          user: {
            id: participant.user.id,
            email: participant.user.email,
            profile: participant.user.profile,
          },
        },
      ];
    });
  }

  async getRoomMessages(roomId: string, userId: string) {
    const isParticipant = await this.isParticipant(roomId, userId);

    if (!isParticipant) {
      console.warn(
        `User ${userId} tried to access messages for room ${roomId} without being a participant`,
      );
      throw new ForbiddenException('Join the room to view its messages');
    }

    const messages = await this.db.query.messages.findMany({
      where: eq(schema.messages.roomId, roomId),
      with: {
        sender: {
          with: {
            profile: true,
          },
        },
      },
      orderBy: [desc(schema.messages.createdAt)],
      limit: 100,
    });

    console.log(`Retrieved ${messages.length} messages for room ${roomId}`);
    return messages.reverse();
  }

  async sendRoomMessage(roomId: string, userId: string, content: string) {
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Message cannot be empty');
    }

    const isParticipant = await this.isParticipant(roomId, userId);

    if (!isParticipant) {
      console.warn(
        `User ${userId} tried to send message to room ${roomId} without being a participant`,
      );
      throw new ForbiddenException('Join the room to send messages');
    }

    const [message] = await this.db
      .insert(schema.messages)
      .values({
        roomId,
        senderId: userId,
        content: normalizedContent,
      })
      .returning();

    console.log(`User ${userId} sent message ${message.id} to room ${roomId}`);

    return this.db.query.messages.findFirst({
      where: eq(schema.messages.id, message.id),
      with: {
        sender: {
          with: {
            profile: true,
          },
        },
      },
    });
  }

  async createInvite(roomId: string, invitedUserId: string, invitedBy: string) {
    await this.checkPermission(roomId, invitedBy, ['owner', 'admin', 'moderator']);

    const [invite] = await this.db
      .insert(schema.roomInvites)
      .values({
        roomId,
        invitedUserId,
        invitedBy,
      })
      .returning();

    return invite;
  }

  async getInvites(userId: string) {
    const invites = await this.db.query.roomInvites.findMany({
      where: eq(schema.roomInvites.invitedUserId, userId),
      with: {
        room: true,
      },
    });

    return invites;
  }

  async acceptInvite(inviteId: string, userId: string) {
    const invite = await this.db.query.roomInvites.findFirst({
      where: eq(schema.roomInvites.id, inviteId),
    });

    if (!invite || invite.invitedUserId !== userId) {
      throw new ForbiddenException('Invalid invite');
    }

    await this.addParticipant(invite.roomId, userId, invite.invitedBy);

    await this.db.delete(schema.roomInvites).where(eq(schema.roomInvites.id, inviteId));

    return this.findById(invite.roomId);
  }

  async rejectInvite(inviteId: string, userId: string) {
    const invite = await this.db.query.roomInvites.findFirst({
      where: eq(schema.roomInvites.id, inviteId),
    });

    if (!invite || invite.invitedUserId !== userId) {
      throw new ForbiddenException('Invalid invite');
    }

    await this.db.delete(schema.roomInvites).where(eq(schema.roomInvites.id, inviteId));
  }

  private async checkPermission(
    roomId: string,
    userId: string,
    allowedRoles: Array<'owner' | 'admin' | 'moderator' | 'participant'>,
  ) {
    const participant = await this.db.query.roomParticipants.findFirst({
      where: and(
        eq(schema.roomParticipants.roomId, roomId),
        eq(schema.roomParticipants.userId, userId),
      ),
    });

    if (!participant || !allowedRoles.includes(participant.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return participant;
  }

  async setCurrentVideo(roomId: string, userId: string, videoUrl: string) {
    await this.checkPermission(roomId, userId, ['owner', 'admin', 'moderator']);

    // Парсим URL видео
    const videoInfo = this.parseVideoUrl(videoUrl);

    if (!videoInfo) {
      throw new BadRequestException('Invalid video URL');
    }

    const [updated] = await this.db
      .update(schema.rooms)
      .set({
        currentVideoUrl: videoUrl,
        currentVideoSource: videoInfo.source,
        currentVideoId: videoInfo.videoId,
        updatedAt: new Date(),
      })
      .where(eq(schema.rooms.id, roomId))
      .returning();

    return updated;
  }

  async getCurrentVideo(roomId: string) {
    const room = await this.findById(roomId);

    if (!room.currentVideoUrl) {
      return null;
    }

    return {
      url: room.currentVideoUrl,
      source: room.currentVideoSource,
      videoId: room.currentVideoId,
    };
  }

  private parseVideoUrl(url: string): { source: string; videoId: string } | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const segments = urlObj.pathname.split('/').filter(Boolean);

      if (hostname === 'youtu.be') {
        const videoId = segments[0];
        if (videoId) {
          return { source: 'youtube', videoId };
        }
      }

      if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
        const isVideoPath = ['shorts', 'embed', 'live', 'v'].includes(segments[0]);
        const videoId = urlObj.searchParams.get('v') || (isVideoPath ? segments[1] : undefined);
        if (videoId) {
          return { source: 'youtube', videoId };
        }
      }

      if (hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com')) {
        const videoId = segments[segments.length - 1];
        if (videoId) {
          return { source: 'vimeo', videoId };
        }
      }

      if (hostname === 'rutube.ru' || hostname.endsWith('.rutube.ru')) {
        const match = urlObj.pathname.match(/\/video\/([a-zA-Z0-9]+)/);
        if (match && match[1]) {
          return { source: 'rutube', videoId: match[1] };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async isParticipant(roomId: string, userId: string): Promise<boolean> {
    const participant = await this.db.query.roomParticipants.findFirst({
      where: and(
        eq(schema.roomParticipants.roomId, roomId),
        eq(schema.roomParticipants.userId, userId),
      ),
    });

    return !!participant;
  }

  async getParticipantRole(roomId: string, userId: string) {
    const participant = await this.db.query.roomParticipants.findFirst({
      where: and(
        eq(schema.roomParticipants.roomId, roomId),
        eq(schema.roomParticipants.userId, userId),
      ),
    });

    return participant?.role;
  }

  async saveVideoProgress(roomId: string, userId: string, videoId: string, currentTime: number, duration?: number) {
    // Check if user is a participant
    if (!(await this.isParticipant(roomId, userId))) {
      throw new ForbiddenException('Not a participant of this room');
    }

    // Find existing progress record
    const existing = await this.db.query.userVideoProgress.findFirst({
      where: and(
        eq(schema.userVideoProgress.roomId, roomId),
        eq(schema.userVideoProgress.userId, userId),
        eq(schema.userVideoProgress.videoId, videoId),
      ),
    });

    if (existing) {
      // Update existing record
      const [updated] = await this.db
        .update(schema.userVideoProgress)
        .set({
          playbackTime: currentTime,
          duration: duration ?? existing.duration,
          updatedAt: new Date(),
        })
        .where(eq(schema.userVideoProgress.id, existing.id))
        .returning();

      return updated;
    } else {
      // Create new record
      const [created] = await this.db
        .insert(schema.userVideoProgress)
        .values({
          roomId,
          userId,
          videoId,
          playbackTime: currentTime,
          duration,
        })
        .returning();

      return created;
    }
  }

  async getVideoProgress(roomId: string, userId: string, videoId: string) {
    const progress = await this.db.query.userVideoProgress.findFirst({
      where: and(
        eq(schema.userVideoProgress.roomId, roomId),
        eq(schema.userVideoProgress.userId, userId),
        eq(schema.userVideoProgress.videoId, videoId),
      ),
    });

    return progress;
  }
}
