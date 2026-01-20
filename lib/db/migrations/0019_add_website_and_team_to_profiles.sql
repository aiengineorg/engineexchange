-- Add website_or_github and has_team columns to profiles table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "website_or_github" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "has_team" boolean DEFAULT false;
