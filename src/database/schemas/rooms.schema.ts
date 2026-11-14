import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, doublePrecision } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const roomTypeEnum = pgEnum('room_type', ['public', 'private']);
export const roomParticipantRoleEnum = pgEnum('room_participant_role', ['owner', 'admin', 'moderator', 'participant']);

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: roomTypeEnum('type').notNull().default('private'),
  isPermanent: boolean('is_permanent').notNull().default(true),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id'),
  lessonId: uuid('lesson_id'),
  currentVideoUrl: text('current_video_url'),
  currentVideoSource: varchar('current_video_source', { length: 50 }),
  currentVideoId: varchar('current_video_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const roomParticipants = pgTable('room_participants', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roomParticipantRoleEnum('role').notNull().default('participant'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const roomInvites = pgTable('room_invites', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  invitedUserId: uuid('invited_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitedBy: uuid('invited_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Store video playback position for each user in each room
export const userVideoProgress = pgTable('user_video_progress', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: varchar('video_id', { length: 255 }).notNull(),
  playbackTime: doublePrecision('playback_time').notNull().default(0), // Position in seconds
  duration: doublePrecision('duration'), // Total video duration
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
