-- Rename old judging_scores table to preserve historical data
ALTER TABLE IF EXISTS "judging_scores" RENAME TO "judging_scores_v1";

-- Rename old indexes/constraints to avoid conflicts
ALTER INDEX IF EXISTS "unique_judge_submission" RENAME TO "unique_judge_submission_v1";
ALTER INDEX IF EXISTS "judging_scores_judge_idx" RENAME TO "judging_scores_v1_judge_idx";
ALTER INDEX IF EXISTS "judging_scores_submission_idx" RENAME TO "judging_scores_v1_submission_idx";

-- Create new judging_scores_v2 table
CREATE TABLE IF NOT EXISTS "judging_scores_v2" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "judge_id" uuid NOT NULL REFERENCES "judges"("id") ON DELETE CASCADE,
  "submission_id" uuid NOT NULL REFERENCES "submissions"("id") ON DELETE CASCADE,
  "future_potential" text NOT NULL,
  "demo" text NOT NULL,
  "creativity" text NOT NULL,
  "pitching_quality" text NOT NULL,
  "brain_rot" text DEFAULT 'false',
  "additional_comments" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create unique constraint for one score per judge per submission
CREATE UNIQUE INDEX IF NOT EXISTS "unique_judge_submission_v2" ON "judging_scores_v2" ("judge_id", "submission_id");

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "judging_scores_v2_judge_idx" ON "judging_scores_v2" ("judge_id");
CREATE INDEX IF NOT EXISTS "judging_scores_v2_submission_idx" ON "judging_scores_v2" ("submission_id");
