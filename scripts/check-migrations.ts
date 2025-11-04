import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const checkMigrations = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const sql = postgres(process.env.POSTGRES_URL);

  console.log("🔍 Checking applied migrations...\n");

  const migrations = await sql`
    SELECT * FROM drizzle.__drizzle_migrations
    ORDER BY created_at;
  `;

  console.log("📋 Applied migrations:");
  migrations.forEach((m) => {
    console.log(`  - ${m.hash} (${new Date(Number(m.created_at)).toISOString()})`);
  });

  await sql.end();
  process.exit(0);
};

checkMigrations().catch((err) => {
  console.error("❌ Check failed:", err);
  process.exit(1);
});
