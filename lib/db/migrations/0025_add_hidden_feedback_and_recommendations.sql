-- Add hidden feedback fields to submissions table
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "sponsor_feature_feedback" text;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "media_permission" text DEFAULT 'false';
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "event_feedback" text;

-- Add recommendation fields to judging_scores table
ALTER TABLE "judging_scores" ADD COLUMN IF NOT EXISTS "recommend_nvidia" text DEFAULT 'false';
ALTER TABLE "judging_scores" ADD COLUMN IF NOT EXISTS "recommend_runware" text DEFAULT 'false';
