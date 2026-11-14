import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';
import { rooms } from './rooms.schema';

export const videoSourceEnum = pgEnum('video_source', ['youtube', 'vimeo', 'rutube', 'archive']);
export const syncModeEnum = pgEnum('sync_mode', ['independent', 'synchronized']);

export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  source: videoSourceEnum('source').notNull(),
  externalId: varchar('external_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  duration: integer('duration'),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  metadata: jsonb('metadata'),
  addedBy: uuid('added_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const videoSyncState = pgTable('video_sync_state', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }).unique(),
  mode: syncModeEnum('mode').notNull().default('independent'),
  currentTime: integer('current_time_position').default(0),
  isPlaying: boolean('is_playing').notNull().default(false),
  lastUpdatedBy: uuid('last_updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
