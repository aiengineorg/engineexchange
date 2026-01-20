#!/usr/bin/env npx tsx
/**
 * Seed hackathon participants from final_profiles.json
 *
 * Usage:
 *   npx tsx scripts/seed-hackathon-participants.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

interface Participant {
  name: string;
  email: string;
  linkedin: string;
  website_or_github: string;
  luma_id: string;
  profile_summary: string | null;
}

async function main() {
  console.log("\n🎫 Seeding Hackathon Participants");
  console.log("==================================\n");

  if (!process.env.POSTGRES_URL) {
    console.error("❌ POSTGRES_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(process.env.POSTGRES_URL);

  try {
    // Read the JSONL file (one JSON object per line)
    const filePath = join(process.cwd(), "final_profiles.json");
    const fileContent = readFileSync(filePath, "utf-8");

    // Parse JSONL format (each line is a separate JSON object)
    const participants: Participant[] = fileContent
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    console.log(`📋 Found ${participants.length} participants to seed\n`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const p of participants) {
      try {
        const emailLower = p.email.toLowerCase();

        // Check if participant already exists
        const existing = await sql`
          SELECT id FROM hackathon_participants WHERE email = ${emailLower}
        `;

        if (existing.length > 0) {
          console.log(`⏭️  ${p.email} - already exists`);
          skipped++;
          continue;
        }

        // Insert new participant
        await sql`
          INSERT INTO hackathon_participants (name, email, linkedin, website_or_github, luma_id, profile_summary)
          VALUES (${p.name}, ${emailLower}, ${p.linkedin}, ${p.website_or_github}, ${p.luma_id}, ${p.profile_summary})
        `;

        console.log(`✅ ${p.email} - inserted`);
        inserted++;
      } catch (error) {
        console.error(`❌ ${p.email} - error: ${error instanceof Error ? error.message : "Unknown error"}`);
        errors++;
      }
    }

    console.log("\n📊 Summary");
    console.log("----------");
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    if (errors > 0) {
      console.log(`   ❌ Errors: ${errors}`);
    }

  } finally {
    await sql.end();
  }

  console.log("\n✅ Done!\n");
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
