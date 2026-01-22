-- Create hackathon participants table (pre-populated from final_profiles.json)
CREATE TABLE IF NOT EXISTS "hackathon_participants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" VARCHAR(256),
  "email" VARCHAR(256) NOT NULL UNIQUE,
  "linkedin" VARCHAR(512),
  "website_or_github" VARCHAR(512),
  "luma_id" VARCHAR(64),
  "profile_summary" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Add email verification fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_token" VARCHAR(8);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_to_verify" VARCHAR(256);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verified_participant_id" UUID REFERENCES "hackathon_participants"("id");

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS "hackathon_participants_email_idx" ON "hackathon_participants" ("email");
CREATE INDEX IF NOT EXISTS "user_email_verification_token_idx" ON "User" ("email_verification_token");
