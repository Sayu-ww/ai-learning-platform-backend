import { pgTable, uuid, varchar, bigint, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  storagePath: varchar('storage_path', { length: 500 }).notNull(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
