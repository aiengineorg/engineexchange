-- Create judges table
CREATE TABLE IF NOT EXISTS "judges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create judging_scores table
CREATE TABLE IF NOT EXISTS "judging_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "judge_id" uuid NOT NULL REFERENCES "judges"("id") ON DELETE CASCADE,
  "submission_id" uuid NOT NULL REFERENCES "submissions"("id") ON DELETE CASCADE,
  "future_potential" text NOT NULL,
  "demo" text NOT NULL,
  "creativity" text NOT NULL,
  "pitching_quality" text NOT NULL,
  "bonus_flux" text DEFAULT '0',
  "additional_comments" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create unique constraint for one score per judge per submission
CREATE UNIQUE INDEX IF NOT EXISTS "unique_judge_submission" ON "judging_scores" ("judge_id", "submission_id");

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "judging_scores_judge_idx" ON "judging_scores" ("judge_id");
CREATE INDEX IF NOT EXISTS "judging_scores_submission_idx" ON "judging_scores" ("submission_id");
