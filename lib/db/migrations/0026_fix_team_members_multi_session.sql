-- Fix team_members unique constraint for multi-session support
-- Old constraint prevented users from joining ANY team if they were already in one (global scope)
-- New constraint only prevents duplicate membership rows (same user + same team)
-- This allows users to be on different teams in different hackathon sessions

DROP INDEX IF EXISTS "unique_user_team";
CREATE UNIQUE INDEX "unique_user_team_membership" ON "team_members" ("user_id", "team_id");
