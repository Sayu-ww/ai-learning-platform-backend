import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '@database/database.module';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '@database/schemas';

@Injectable()
export class FriendsService {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const existing = await this.db.query.friends.findFirst({
      where: or(
        and(eq(schema.friends.userId, userId), eq(schema.friends.friendId, friendId)),
        and(eq(schema.friends.userId, friendId), eq(schema.friends.friendId, userId)),
      ),
    });

    if (existing) {
      throw new BadRequestException('Friend request already exists');
    }

    const [request] = await this.db
      .insert(schema.friends)
      .values({
        userId,
        friendId,
        status: 'pending',
      })
      .returning();

    return request;
  }

  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.db.query.friends.findFirst({
      where: eq(schema.friends.id, requestId),
    });

    if (!request || request.friendId !== userId) {
      throw new BadRequestException('Invalid friend request');
    }

    const [updated] = await this.db
      .update(schema.friends)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(schema.friends.id, requestId))
      .returning();

    return updated;
  }

  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.db.query.friends.findFirst({
      where: eq(schema.friends.id, requestId),
    });

    if (!request || request.friendId !== userId) {
      throw new BadRequestException('Invalid friend request');
    }

    await this.db.delete(schema.friends).where(eq(schema.friends.id, requestId));
  }

  async removeFriend(userId: string, friendId: string) {
    await this.db
      .delete(schema.friends)
      .where(
        or(
          and(eq(schema.friends.userId, userId), eq(schema.friends.friendId, friendId)),
          and(eq(schema.friends.userId, friendId), eq(schema.friends.friendId, userId)),
        ),
      );
  }

  async getFriends(userId: string) {
    const friendships = await this.db.query.friends.findMany({
      where: and(
        or(eq(schema.friends.userId, userId), eq(schema.friends.friendId, userId)),
        eq(schema.friends.status, 'accepted'),
      ),
    });

    return friendships;
  }

  async getPendingRequests(userId: string) {
    const requests = await this.db.query.friends.findMany({
      where: and(eq(schema.friends.friendId, userId), eq(schema.friends.status, 'pending')),
    });

    return requests;
  }
}
