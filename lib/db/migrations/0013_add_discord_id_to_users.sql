-- Add discord_id column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "discord_id" VARCHAR(32);

