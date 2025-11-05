import type { InferSelectModel } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// Core user table (keep for authentication)
export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

// Stub types for unused chatbot features (artifacts, documents, etc.)
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  userId: string;
}

// Re-export matching tables
export {
  matchingSessions,
  profiles,
  swipes,
  matches,
  matchMessages,
} from "./schema/matching";
export type {
  MatchingSession,
  Profile,
  Swipe,
  Match,
  MatchMessage,
} from "./schema/matching";
