-- Create submissions table
CREATE TABLE IF NOT EXISTS "submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL UNIQUE REFERENCES "teams"("id") ON DELETE CASCADE,
  "project_name" text NOT NULL,
  "github_link" text NOT NULL,
  "description" text NOT NULL,
  "demo_link" text,
  "tech_stack" text NOT NULL,
  "problem_statement" text NOT NULL,
  "file_uploads" jsonb DEFAULT '[]'::jsonb,
  "submitted_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index for submissions
CREATE INDEX IF NOT EXISTS "submissions_team_idx" ON "submissions" ("team_id");
