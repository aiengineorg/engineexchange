-- Add sponsor_tech column to submissions table
ALTER TABLE "submissions" ADD COLUMN "sponsor_tech" jsonb DEFAULT '[]'::jsonb;
