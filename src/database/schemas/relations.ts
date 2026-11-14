import { relations } from 'drizzle-orm';
import { messages } from './chat.schema';
import { profiles } from './profiles.schema';
import { roomParticipants, rooms, userVideoProgress } from './rooms.schema';
import { users } from './users.schema';

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  participants: many(roomParticipants),
  videoProgress: many(userVideoProgress),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(rooms, {
    fields: [roomParticipants.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id],
  }),
}));

export const userVideoProgressRelations = relations(userVideoProgress, ({ one }) => ({
  room: one(rooms, {
    fields: [userVideoProgress.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [userVideoProgress.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));
