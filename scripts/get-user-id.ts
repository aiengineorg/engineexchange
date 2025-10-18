import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";

// Load environment variables from .env.local
config({ path: ".env.local" });

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function main() {
  const users = await db.select().from(user).limit(1);
  
  if (users.length === 0) {
    console.log("No users found in database. Please create a user first.");
    process.exit(1);
  }
  
  console.log("User ID:", users[0].id);
  console.log("Email:", users[0].email);
  
  await client.end();
}

main();

