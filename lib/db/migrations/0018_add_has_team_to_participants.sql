-- Add has_team column to hackathon_participants table
ALTER TABLE "hackathon_participants" ADD COLUMN IF NOT EXISTS "has_team" boolean DEFAULT false;
