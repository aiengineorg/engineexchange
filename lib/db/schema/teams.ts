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
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    teamIdx: index("submissions_team_idx").on(table.teamId),
  })
);

export type Submission = InferSelectModel<typeof submissions>;
