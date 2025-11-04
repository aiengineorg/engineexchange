import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const checkSchema = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const sql = postgres(process.env.POSTGRES_URL);

  console.log("🔍 Checking for matching tables...\n");

  const targetTables = [
    "matching_sessions",
    "profiles",
    "swipes",
    "matches",
    "match_messages",
  ];

  for (const table of targetTables) {
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${table}
      );
    `;
    console.log(`  ${exists[0].exists ? "✅" : "❌"} ${table}`);
  }

  console.log("\n🔍 Checking old tables to drop...\n");

  const oldTables = [
    "Chat",
    "Document",
    "Embeddings",
    "Resources",
    "Message_v2",
    "Vote_v2",
  ];

  for (const table of oldTables) {
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${table}
      );
    `;
    console.log(`  ${exists[0].exists ? "⚠️ " : "✅"} ${table}`);
  }

  await sql.end();
  process.exit(0);
};

checkSchema().catch((err) => {
  console.error("❌ Check failed:", err);
  process.exit(1);
});
