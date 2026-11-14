import { pgTable, uuid, integer, jsonb, doublePrecision, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';
import { rooms } from './rooms.schema';

export const boardObjectTypeEnum = pgEnum('board_object_type', [
  'path',
  'rectangle',
  'circle',
  'line',
  'arrow',
  'text',
  'image',
  'sticky',
  'formula'
]);

export const boards = pgTable('boards', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }).unique(),
  currentPage: integer('current_page').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const boardObjects = pgTable('board_objects', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  type: boardObjectTypeEnum('type').notNull(),
  data: jsonb('data').notNull(),
  videoTimestamp: doublePrecision('video_timestamp'),
  layerIndex: integer('layer_index').notNull().default(0),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
