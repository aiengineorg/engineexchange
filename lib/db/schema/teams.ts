import type { InferSelectModel } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../schema";
import { matchingSessions } from "./matching";

// Teams table (hackathon teams)
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull(),
    teamNumber: text("team_number").notNull(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => matchingSessions.id, { onDelete: "cascade" }),
    teamLeadId: uuid("team_lead_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Team number is unique within a session
    teamNumberSessionUnique: uniqueIndex("team_number_session_unique").on(
      table.teamNumber,
      table.sessionId
    ),
    teamLeadIdx: index("team_lead_idx").on(table.teamLeadId),
    sessionIdx: index("teams_session_idx").on(table.sessionId),
  })
);

export type Team = InferSelectModel<typeof teams>;

// Team members junction table
export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => ({
    // Ensure one team per user (user can only be in one team)
    uniqueUserTeam: uniqueIndex("unique_user_team").on(table.userId),
    // Fast lookup by team
    teamIdx: index("team_members_team_idx").on(table.teamId),
  })
);

export type TeamMember = InferSelectModel<typeof teamMembers>;

// Submissions table (one submission per team)
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .unique() // One submission per team
      .references(() => teams.id, { onDelete: "cascade" }),
    projectName: text("project_name").notNull(),
    githubLink: text("github_link").notNull(),
    description: text("description").notNull(),
    demoLink: text("demo_link"),
    techStack: text("tech_stack").notNull(),
    problemStatement: text("problem_statement").notNull(),
    fileUploads: jsonb("file_uploads").$type<string[]>().default([]),
    sponsorTech: jsonb("sponsor_tech").$type<string[]>().default([]),
    // Hidden feedback fields (visible only to judges/admins)
    sponsorFeatureFeedback: text("sponsor_feature_feedback"), // "Did you use any feature from the sponsor that you loved?"
    mediaPermission: text("media_permission").default("false"), // "Do you grant permission for multimedia usage?"
    eventFeedback: text("event_feedback"), // "Anything else? Any quick feedback about the event?"
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    teamIdx: index("submissions_team_idx").on(table.teamId),
  })
);

export type Submission = InferSelectModel<typeof submissions>;

// Judges table
export const judges = pgTable(
  "judges",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull().unique(),
    judgingGroup: text("judging_group"), // e.g., "Group A", "Group B", etc.
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
);

export type Judge = InferSelectModel<typeof judges>;

// Judging scores table
export const judgingScores = pgTable(
  "judging_scores",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    judgeId: uuid("judge_id")
      .notNull()
      .references(() => judges.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    futurePotential: text("future_potential").notNull(), // Score out of 10
    demo: text("demo").notNull(), // Score out of 10
    creativity: text("creativity").notNull(), // Score out of 10
    pitchingQuality: text("pitching_quality").notNull(), // Score out of 10
    bonusFlux: text("bonus_flux").default("0"), // Bonus score for using BFL Flux.2
    additionalComments: text("additional_comments"),
    // Sponsor challenge recommendations
    recommendNvidia: text("recommend_nvidia").default("false"), // "Would you recommend for NVIDIA agentic challenge?"
    recommendRunware: text("recommend_runware").default("false"), // "Would you recommend for Runware platform challenge?"
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // One score per judge per submission
    uniqueJudgeSubmission: uniqueIndex("unique_judge_submission").on(
      table.judgeId,
      table.submissionId
    ),
    judgeIdx: index("judging_scores_judge_idx").on(table.judgeId),
    submissionIdx: index("judging_scores_submission_idx").on(table.submissionId),
  })
);

export type JudgingScore = InferSelectModel<typeof judgingScores>;
