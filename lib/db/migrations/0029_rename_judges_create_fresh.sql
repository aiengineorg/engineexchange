-- Drop the FK constraint on judging_scores_v2 that references judges
-- (it will follow the rename otherwise and point to judges_v1)
ALTER TABLE "judging_scores_v2" DROP CONSTRAINT IF EXISTS "judging_scores_v2_judge_id_judges_id_fk";

-- Rename old judges table to preserve historical data
ALTER TABLE IF EXISTS "judges" RENAME TO "judges_v1";

-- Rename old unique constraint to avoid conflicts
ALTER INDEX IF EXISTS "judges_name_unique" RENAME TO "judges_v1_name_unique";

-- Create fresh judges table for new hackathon
CREATE TABLE IF NOT EXISTS "judges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "judging_group" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Re-add FK constraint on judging_scores_v2 referencing the new judges table
ALTER TABLE "judging_scores_v2"
  ADD CONSTRAINT "judging_scores_v2_judge_id_judges_id_fk"
  FOREIGN KEY ("judge_id") REFERENCES "judges"("id") ON DELETE CASCADE;
