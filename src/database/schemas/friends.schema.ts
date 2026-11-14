import { pgTable, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const friendStatusEnum = pgEnum('friend_status', ['pending', 'accepted', 'blocked']);

export const friends = pgTable('friends', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: uuid('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: friendStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
