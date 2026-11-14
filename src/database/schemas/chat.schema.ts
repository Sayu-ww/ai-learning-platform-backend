import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  timestamp,
  pgEnum,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';
import { rooms } from './rooms.schema';

export const chatTypeEnum = pgEnum('chat_type', ['direct', 'group']);

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  type: chatTypeEnum('type').notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const chatParticipants = pgTable('chat_participants', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  videoTimestamp: doublePrecision('video_timestamp'),
  replyTo: uuid('reply_to').references((): AnyPgColumn => messages.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const messageReactions = pgTable('message_reactions', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
