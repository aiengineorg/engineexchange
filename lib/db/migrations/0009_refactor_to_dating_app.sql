-- Migration: Refactor AI Chatbot to Dating/Matching App
-- This migration drops all chat-related tables and creates new matching tables

--> statement-breakpoint
-- Drop old tables (in order to handle foreign key constraints)
--> statement-breakpoint
DROP TABLE IF EXISTS "Vote_v2" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Vote" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Suggestion" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Message_v2" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Message" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Stream" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Document" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Chat" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Embeddings" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "Resources" CASCADE;

--> statement-breakpoint
-- Create new matching tables
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matching_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "code" text NOT NULL UNIQUE,
  "created_by" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "display_name" text NOT NULL,
  "age" integer NOT NULL,
  "bio" text,
  "images" text[] DEFAULT '{}',
  "what_i_offer" text NOT NULL,
  "what_i_offer_embedding" vector(1536),
  "what_im_looking_for" text NOT NULL,
  "what_im_looking_for_embedding" vector(1536),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "swipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "swiping_user_id" uuid NOT NULL,
  "target_user_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "decision" text NOT NULL CHECK ("decision" IN ('yes', 'no')),
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user1_id" uuid NOT NULL,
  "user2_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
-- Add foreign key constraints
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matching_sessions" ADD CONSTRAINT "matching_sessions_created_by_User_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_session_id_matching_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."matching_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiping_user_id_profiles_id_fk" FOREIGN KEY ("swiping_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "swipes" ADD CONSTRAINT "swipes_target_user_id_profiles_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "swipes" ADD CONSTRAINT "swipes_session_id_matching_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."matching_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_user1_id_profiles_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_user2_id_profiles_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_session_id_matching_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."matching_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_messages" ADD CONSTRAINT "match_messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_messages" ADD CONSTRAINT "match_messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
-- Create indexes for fast lookups
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_session_unique" ON "profiles" ("user_id", "session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_idx" ON "profiles" ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_idx" ON "profiles" ("user_id");

--> statement-breakpoint
-- Create HNSW indexes for vector similarity search
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offer_embedding_hnsw_idx" ON "profiles" USING hnsw ("what_i_offer_embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "looking_for_embedding_hnsw_idx" ON "profiles" USING hnsw ("what_im_looking_for_embedding" vector_cosine_ops);

--> statement-breakpoint
-- Create indexes for swipes table
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swiping_user_idx" ON "swipes" ("swiping_user_id", "session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "target_user_idx" ON "swipes" ("target_user_id", "session_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_swipe" ON "swipes" ("swiping_user_id", "target_user_id");

--> statement-breakpoint
-- Create indexes for matches table
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_match" ON "matches" ("user1_id", "user2_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user1_idx" ON "matches" ("user1_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user2_idx" ON "matches" ("user2_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_session_idx" ON "matches" ("session_id");

--> statement-breakpoint
-- Create indexes for match_messages table
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "match_created_idx" ON "match_messages" ("match_id", "created_at");
