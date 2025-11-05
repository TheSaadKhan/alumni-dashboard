// Drizzle ORM schema stub for profiles (optional)
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  auth_user_id: uuid('auth_user_id').notNull(),
  email: text('email').notNull(),
  full_name: text('full_name'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
