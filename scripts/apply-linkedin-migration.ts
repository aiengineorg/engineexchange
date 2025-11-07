import { config } from "dotenv";
import postgres from "postgres";

// Load .env.local if it exists
config({
  path: ".env.local",
});

const runMigration = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

  console.log("⏳ Applying LinkedIn enrichment migration...");

  try {
    await sql`
      ALTER TABLE "profiles" 
      ADD COLUMN IF NOT EXISTS "linkedin_url" TEXT;
    `;
    console.log("✅ Added linkedin_url column");

    await sql`
      ALTER TABLE "profiles" 
      ADD COLUMN IF NOT EXISTS "linkedin_enrichment_summary" TEXT;
    `;
    console.log("✅ Added linkedin_enrichment_summary column");

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
};

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

