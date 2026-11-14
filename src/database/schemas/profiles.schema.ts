import { pgTable, uuid, varchar, text, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const languageEnum = pgEnum('language', ['en', 'ru']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  bio: text('bio'),
  language: languageEnum('language').notNull().default('en'),
});
