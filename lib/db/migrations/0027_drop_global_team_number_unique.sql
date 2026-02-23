-- Drop the old global unique constraint on team_number
-- The correct session-scoped constraint (team_number_session_unique) already exists
DROP INDEX IF EXISTS "teams_team_number_key";
ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_team_number_key";
