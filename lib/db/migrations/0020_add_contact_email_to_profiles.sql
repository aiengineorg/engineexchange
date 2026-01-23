-- Add contact_email column to profiles table for teams/submissions access
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "contact_email" text;
