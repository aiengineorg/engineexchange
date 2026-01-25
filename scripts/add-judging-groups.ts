import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

async function addJudgingGroupsColumn() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log("Adding judging_group column to judges table...");

    // Add the judging_group column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE "judges"
      ADD COLUMN IF NOT EXISTS "judging_group" text;
    `);

    console.log("Successfully added judging_group column!");
  } catch (error) {
    console.error("Error adding column:", error);
    throw error;
  } finally {
    await client.end();
  }
}

addJudgingGroupsColumn()
  .then(() => {
    console.log("Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
