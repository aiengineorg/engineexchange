-- Add LinkedIn enrichment fields to profiles table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "linkedin_url" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "linkedin_enrichment_summary" TEXT;

