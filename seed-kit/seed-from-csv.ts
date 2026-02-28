#!/usr/bin/env npx tsx
/**
 * Seed hackathon participants from a Luma CSV export (approved guests).
 *
 * Usage:
 *   npx tsx seed-from-csv.ts <path-to-csv>
 *
 * Example:
 *   npx tsx seed-from-csv.ts "Build - UCL AI Festival - Guests - approved - 2026-02-27.csv"
 *
 * Requires:
 *   - .env.local with POSTGRES_URL set
 *   - pnpm install (for postgres + dotenv)
 */

import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), ".env.local") });
import postgres from "postgres";

/**
 * Parse a CSV string into an array of objects keyed by header names.
 * Handles quoted fields with commas and escaped quotes.
 */
function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let fields: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else if (ch === "\n" || (ch === "\r" && content[i + 1] === "\n")) {
        fields.push(current.trim());
        current = "";
        if (fields.some((f) => f.length > 0)) {
          rows.push(fields);
        }
        fields = [];
        if (ch === "\r") i++;
      } else {
        current += ch;
      }
    }
  }

  if (current.length > 0 || fields.length > 0) {
    fields.push(current.trim());
    if (fields.some((f) => f.length > 0)) {
      rows.push(fields);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

function buildProfileSummary(row: Record<string, string>): string | null {
  const parts: string[] = [];

  const title = row["Title (e.g. SWE) / Field of Study (if in university)"]?.trim();
  const org = row["What's your organisation? (University/Company)"]?.trim();
  const describes = row["What best describes you?"]?.trim();
  const skillset = row["What's your key skillset?"]?.trim();

  if (title && org) {
    parts.push(`${title} at ${org}`);
  } else if (title) {
    parts.push(title);
  } else if (org) {
    parts.push(org);
  }

  if (describes) {
    parts.push(describes);
  }

  if (skillset) {
    parts.push(`Skills: ${skillset}`);
  }

  return parts.length > 0 ? parts.join(". ") : null;
}

async function main() {
  const csvFile = process.argv[2];

  if (!csvFile) {
    console.error("Usage: npx tsx seed-from-csv.ts <path-to-csv>");
    console.error('Example: npx tsx seed-from-csv.ts "Build - UCL AI Festival - Guests - approved - 2026-02-27.csv"');
    process.exit(1);
  }

  console.log("\n🎫 Seeding Hackathon Participants from CSV");
  console.log("=============================================\n");

  if (!process.env.POSTGRES_URL) {
    console.error("❌ POSTGRES_URL environment variable is required (set in .env.local)");
    process.exit(1);
  }

  const sql = postgres(process.env.POSTGRES_URL);

  try {
    const filePath = csvFile.startsWith("/") ? csvFile : join(process.cwd(), csvFile);
    const fileContent = readFileSync(filePath, "utf-8");

    const rows = parseCsv(fileContent);

    console.log(`📋 Found ${rows.length} approved guests in CSV\n`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      if (!row.email?.trim()) {
        console.log(`⏭️  Row with name "${row.name}" has no email - skipping`);
        skipped++;
        continue;
      }

      const emailLower = row.email.trim().toLowerCase();
      const name = row.name?.trim() || null;
      const linkedin = row["What is your LinkedIn profile?"]?.trim() || null;
      const websiteOrGithub =
        row["Link to personal website/github/portfolio"]?.trim() || null;
      const lumaId = row.api_id?.trim() || null;
      const profileSummary = buildProfileSummary(row);
      const hasTeam =
        row["Are you applying as a team? (max 4 per team)"]?.trim().toLowerCase() === "yes";

      try {
        const existing = await sql`
          SELECT id FROM hackathon_participants WHERE email = ${emailLower}
        `;

        if (existing.length > 0) {
          console.log(`⏭️  ${emailLower} - already exists`);
          skipped++;
          continue;
        }

        await sql`
          INSERT INTO hackathon_participants (name, email, linkedin, website_or_github, luma_id, profile_summary, has_team)
          VALUES (${name}, ${emailLower}, ${linkedin}, ${websiteOrGithub}, ${lumaId}, ${profileSummary}, ${hasTeam})
        `;

        console.log(`✅ ${emailLower} - inserted`);
        inserted++;
      } catch (error) {
        console.error(
          `❌ ${emailLower} - error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
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
