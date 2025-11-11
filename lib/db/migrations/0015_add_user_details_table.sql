-- Create user_details table for enriched LinkedIn data from Clay
CREATE TABLE IF NOT EXISTS "user_details" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" text,
  "linkedin_url" text,
  "email" text,
  "event_name" text,
  "first_name" text,
  "last_name" text,
  "title" text,
  "headline" text,
  "summary" text,
  "education" text,
  "experience" text,
  "location" text,
  "connections" integer,
  "profile_picture" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
