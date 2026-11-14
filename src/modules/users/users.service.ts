import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION, type Database } from '@database/database.module';
import { eq, ilike, or } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import * as schema from '@database/schemas';

type UserInsert = InferInsertModel<typeof schema.users>;
type ProfileInsert = InferInsertModel<typeof schema.profiles>;

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async create(data: Pick<UserInsert, 'email' | 'passwordHash' | 'role'>) {
    const [user] = await this.db.insert(schema.users).values(data).returning();
    return user;
  }

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    return user;
  }

  async search(query: string, limit = 20) {
    const users = await this.db.query.users.findMany({
      where: ilike(schema.users.email, `%${query}%`),
      limit,
      with: {
        profile: true,
      },
    });
    return users.map(({ passwordHash, ...user }) => user);
  }

  async update(id: string, data: Partial<Pick<UserInsert, 'email' | 'role'>>) {
    const [updated] = await this.db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updated;
  }

  async createProfile(
    userId: string,
    data: Pick<ProfileInsert, 'displayName' | 'language'>,
  ) {
    const [profile] = await this.db
      .insert(schema.profiles)
      .values({ userId, ...data })
      .returning();
    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, userId),
    });
    return profile;
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<ProfileInsert, 'displayName' | 'avatarUrl' | 'bio' | 'language'>>,
  ) {
    const [updated] = await this.db
      .update(schema.profiles)
      .set(data)
      .where(eq(schema.profiles.userId, userId))
      .returning();
    return updated;
  }

  async createRefreshToken(data: { userId: string; token: string; expiresAt: Date }) {
    const [token] = await this.db.insert(schema.refreshTokens).values(data).returning();
    return token;
  }

  async findRefreshToken(token: string) {
    const refreshToken = await this.db.query.refreshTokens.findFirst({
      where: eq(schema.refreshTokens.token, token),
    });
    return refreshToken;
  }

  async deleteRefreshToken(id: string) {
    await this.db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.id, id));
  }

  async deleteExpiredRefreshTokens() {
    await this.db
      .delete(schema.refreshTokens)
      .where(eq(schema.refreshTokens.expiresAt, new Date()));
  }
}
