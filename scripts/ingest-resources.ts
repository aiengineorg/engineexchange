import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resources } from "@/lib/db/schema/resources";
import { embeddings as embeddingsTable } from "@/lib/db/schema";
import { generateEmbeddings } from "@/lib/ai/embeddings";

// Load environment variables from .env.local
config({ path: ".env.local" });

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// You'll need to set this to a valid user ID from your database
const DEFAULT_USER_ID =
  process.env.DEFAULT_USER_ID || "a6c8cebc-c959-4c26-b968-2a01d19f76fe";

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...(await getAllMarkdownFiles(fullPath)));
    } else if (item.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function ingestMarkdownFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);
    
    console.log(`Processing: ${fileName}`);
    
    // Skip empty files
    if (!content.trim()) {
      console.log(`  Skipped (empty file)`);
      return;
    }
    
    // Add file name as context to the content
    const contentWithContext = `# ${fileName}\n\n${content}`;
    
    // Create resource
    const [resource] = await db
      .insert(resources)
      .values({
        content: contentWithContext,
        userId: DEFAULT_USER_ID,
      })
      .returning();
    
    console.log(`  Created resource: ${resource.id}`);
    
    // Generate and store embeddings
    const embeddings = await generateEmbeddings(contentWithContext);
    
    if (embeddings.length > 0) {
      await db.insert(embeddingsTable).values(
        embeddings.map((embedding) => ({
          resourceId: resource.id,
          ...embedding,
        }))
      );
      console.log(`  Created ${embeddings.length} embeddings`);
    }
    
    console.log(`  ✅ Success\n`);
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error);
  }
}

async function main() {
  const resourcesDir = path.join(process.cwd(), "resources");
  
  if (!fs.existsSync(resourcesDir)) {
    console.error("Resources directory not found!");
    process.exit(1);
  }
  
  console.log("Finding all markdown files...\n");
  const markdownFiles = await getAllMarkdownFiles(resourcesDir);
  
  console.log(`Found ${markdownFiles.length} markdown files\n`);
  console.log("Starting ingestion...\n");
  
  for (const file of markdownFiles) {
    await ingestMarkdownFile(file);
  }
  
  console.log("\n✅ Ingestion complete!");
  await client.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

