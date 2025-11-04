import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const checkTables = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const sql = postgres(process.env.POSTGRES_URL);

  console.log("🔍 Checking database tables...\n");

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log("📋 Current tables:");
  tables.forEach((t) => console.log(`  - ${t.table_name}`));

  await sql.end();
  process.exit(0);
};

checkTables().catch((err) => {
  console.error("❌ Check failed:", err);
  process.exit(1);
});
