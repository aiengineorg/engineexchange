import type { InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { z } from "zod";
import { user } from "../schema";

export const resources = pgTable("Resources", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Resource = InferSelectModel<typeof resources>;

export const insertResourceSchema = z.object({
  content: z.string(),
  userId: z.string().optional(),
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;

