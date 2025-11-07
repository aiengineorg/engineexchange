import type { InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { user } from "../schema";

// Matching Sessions (like speed dating events)
export const matchingSessions = pgTable("matching_sessions", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MatchingSession = InferSelectModel<typeof matchingSessions>;

// User Profiles (one per session)
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => matchingSessions.id, { onDelete: "cascade" }),

    // Basic Info
    displayName: text("display_name").notNull(),
    images: text("images").array().default([]),

    // LinkedIn Enrichment (via Clay)
    linkedinUrl: text("linkedin_url"),
    linkedinEnrichmentSummary: text("linkedin_enrichment_summary"),

    // Vector Embedding Fields (Core Feature!)
    whatIOffer: text("what_i_offer").notNull(),
    whatIOfferEmbedding: vector("what_i_offer_embedding", { dimensions: 1536 }),

    whatImLookingFor: text("what_im_looking_for").notNull(),
    whatImLookingForEmbedding: vector("what_im_looking_for_embedding", {
      dimensions: 1536,
    }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Ensure one profile per user per session
    userSessionUnique: uniqueIndex("user_session_unique").on(
      table.userId,
      table.sessionId
    ),

    // Fast lookups
    sessionIdx: index("session_idx").on(table.sessionId),
    userIdx: index("user_idx").on(table.userId),

    // HNSW indexes for fast vector similarity search
    offerEmbeddingIdx: index("offer_embedding_hnsw_idx").using(
      "hnsw",
      table.whatIOfferEmbedding.op("vector_cosine_ops")
    ),

    lookingForEmbeddingIdx: index("looking_for_embedding_hnsw_idx").using(
      "hnsw",
      table.whatImLookingForEmbedding.op("vector_cosine_ops")
    ),
  })
);

export type Profile = InferSelectModel<typeof profiles>;

// Swipes (yes/no decisions)
export const swipes = pgTable(
  "swipes",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    swipingUserId: uuid("swiping_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => matchingSessions.id, { onDelete: "cascade" }),
    decision: text("decision", { enum: ["yes", "no"] }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Fast lookups for "who swiped on me" and "who did I swipe on"
    swipingUserIdx: index("swiping_user_idx").on(
      table.swipingUserId,
      table.sessionId
    ),
    targetUserIdx: index("target_user_idx").on(
      table.targetUserId,
      table.sessionId
    ),

    // Prevent duplicate swipes
    uniqueSwipe: uniqueIndex("unique_swipe").on(
      table.swipingUserId,
      table.targetUserId
    ),
  })
);

export type Swipe = InferSelectModel<typeof swipes>;

// Matches (mutual yes swipes)
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user1Id: uuid("user1_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    user2Id: uuid("user2_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => matchingSessions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicate matches
    uniqueMatch: uniqueIndex("unique_match").on(table.user1Id, table.user2Id),

    // Fast lookups
    user1Idx: index("user1_idx").on(table.user1Id),
    user2Idx: index("user2_idx").on(table.user2Id),
    sessionIdx: index("match_session_idx").on(table.sessionId),
  })
);

export type Match = InferSelectModel<typeof matches>;

// Match Messages (1:1 chat between matches)
export const matchMessages = pgTable(
  "match_messages",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Fast retrieval of conversation history
    matchCreatedIdx: index("match_created_idx").on(
      table.matchId,
      table.createdAt
    ),
  })
);

export type MatchMessage = InferSelectModel<typeof matchMessages>;
