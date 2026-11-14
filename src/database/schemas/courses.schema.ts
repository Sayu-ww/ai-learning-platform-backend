import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';
import { videos } from './videos.schema';

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isAiGenerated: boolean('is_ai_generated').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  videoId: uuid('video_id').references(() => videos.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completed: boolean('completed').notNull().default(false),
  lastPosition: integer('last_position').default(0),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
