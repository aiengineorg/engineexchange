-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "team_number" text NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "matching_sessions"("id") ON DELETE CASCADE,
  "team_lead_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "added_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for teams
CREATE UNIQUE INDEX IF NOT EXISTS "team_number_session_unique" ON "teams" ("team_number", "session_id");
CREATE INDEX IF NOT EXISTS "team_lead_idx" ON "teams" ("team_lead_id");
CREATE INDEX IF NOT EXISTS "teams_session_idx" ON "teams" ("session_id");

-- Create indexes for team_members
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_team" ON "team_members" ("user_id");
CREATE INDEX IF NOT EXISTS "team_members_team_idx" ON "team_members" ("team_id");
