import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { matchingSessions, user } from "../lib/db/schema";
import { nanoid } from "nanoid";

config({ path: ".env.local" });

const SESSION_NAME = "Build: AI Festival";

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL environment variable is required");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  // Get the first user as the session creator
  const [firstUser] = await db.select({ id: user.id }).from(user).limit(1);

  if (!firstUser) {
    console.error("No users found in database. Cannot create session.");
    await client.end();
    process.exit(1);
  }

  // Generate a unique 6-char code
  const code = nanoid(6).toUpperCase();

  const [session] = await db
    .insert(matchingSessions)
    .values({
      name: SESSION_NAME,
      code,
      createdBy: firstUser.id,
    })
    .returning();

  console.log("\n========================================");
  console.log("  New Session Created Successfully!");
  console.log("========================================");
  console.log(`  Name:       ${session.name}`);
  console.log(`  ID:         ${session.id}`);
  console.log(`  Code:       ${session.code}`);
  console.log(`  Created At: ${session.createdAt}`);
  console.log("========================================");
  console.log("\nNext steps:");
  console.log(`  1. Set DEFAULT_SESSION_ID=${session.id} in .env.local`);
  console.log(`  2. Set NEXT_PUBLIC_DEFAULT_SESSION_ID=${session.id} in .env.local`);
  console.log("  3. Restart the dev server / redeploy");
  console.log("");

  await client.end();
}

main().catch((err) => {
  console.error("Failed to create session:", err);
  process.exit(1);
});
