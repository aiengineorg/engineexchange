import type { InferSelectModel } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar, jsonb, text, boolean } from "drizzle-orm/pg-core";

// Hackathon participants table (pre-populated from final_profiles.json)
export const hackathonParticipants = pgTable("hackathon_participants", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 256 }),
  email: varchar("email", { length: 256 }).notNull().unique(),
  linkedin: varchar("linkedin", { length: 512 }),
  websiteOrGithub: varchar("website_or_github", { length: 512 }),
  lumaId: varchar("luma_id", { length: 64 }),
  profileSummary: text("profile_summary"),
  hasTeam: boolean("has_team").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type HackathonParticipant = InferSelectModel<typeof hackathonParticipants>;

// Core user table (keep for authentication)
export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  discordId: varchar("discord_id", { length: 32 }),
  // Account claim fields for Luma sync
  claimToken: varchar("claim_token", { length: 64 }),
  claimTokenExpiresAt: timestamp("claim_token_expires_at"),
  lumaGuestId: varchar("luma_guest_id", { length: 64 }),
  displayName: varchar("display_name", { length: 128 }),
  // Luma registration data (form answers from event registration)
  lumaRegistrationData: jsonb("luma_registration_data"),
  // Email verification for hackathon participants
  emailVerificationToken: varchar("email_verification_token", { length: 8 }),
  emailToVerify: varchar("email_to_verify", { length: 256 }),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
  verifiedParticipantId: uuid("verified_participant_id").references(() => hackathonParticipants.id),
});

export type User = InferSelectModel<typeof user>;

// Re-export matching tables
export {
  matchingSessions,
  profiles,
  swipes,
  matches,
  matchMessages,
  userDetails,
} from "./schema/matching";
export type {
  MatchingSession,
  Profile,
  Swipe,
  Match,
  MatchMessage,
  UserDetail,
} from "./schema/matching";
