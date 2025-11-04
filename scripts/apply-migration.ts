import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

config({ path: ".env.local" });

const applyMigration = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const sql = postgres(process.env.POSTGRES_URL);

  console.log("⏳ Applying migration 0009_refactor_to_dating_app.sql...\n");

  try {
    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      "lib/db/migrations/0009_refactor_to_dating_app.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split by statement breakpoints and execute
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }

    console.log("✅ Migration applied successfully!");

    // Record in drizzle migrations table
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('refactor_to_dating_app_manual', ${Date.now()})
      ON CONFLICT DO NOTHING;
    `;

    console.log("✅ Migration recorded in journal");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error);
    throw error;
  } finally {
    await sql.end();
  }

  process.exit(0);
};

applyMigration().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
