import { config } from "dotenv";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { user } from "../lib/db/schema";
import { generateHashedPassword } from "../lib/db/utils";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

const MOCK_PASSWORD = "password123"; // Simple password for all mock users

const mockEmails = [
  "sarah.tech@example.com",
  "mike.bizdev@example.com",
  "emily.product@example.com",
  "alex.ml@example.com",
  "jessica.data@example.com",
  "david.devrel@example.com",
  "rachel.ops@example.com",
  "tom.security@example.com",
  "lisa.mobile@example.com",
  "james.blockchain@example.com",
];

async function main() {
  const connectionString = process.env.POSTGRES_URL!;
  
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is not set");
  }
  
  console.log("🔌 Connecting to database...");
  const client = postgres(connectionString, {
    ssl: 'require',
    max: 1,
  });
  const db = drizzle(client);

  console.log("🔐 Setting passwords for mock users...");
  console.log(`📝 Password: ${MOCK_PASSWORD}\n`);

  const hashedPassword = generateHashedPassword(MOCK_PASSWORD);

  for (const email of mockEmails) {
    try {
      const [updatedUser] = await db
        .update(user)
        .set({ password: hashedPassword })
        .where(eq(user.email, email))
        .returning();

      if (updatedUser) {
        console.log(`✅ ${email} - password updated`);
      } else {
        console.log(`⚠️  ${email} - user not found`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${email}:`, error);
    }
  }

  console.log("\n\n✅ Password update complete!");
  console.log(`🔑 You can now log in with any of these emails using password: ${MOCK_PASSWORD}`);
  console.log("\n📧 Mock User Emails:");
  for (const email of mockEmails) {
    console.log(`   - ${email}`);
  }

  await client.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

