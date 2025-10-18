import "server-only";

import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { embeddings, resources } from "@/lib/db/schema";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

const embeddingModel = openai.embedding("text-embedding-ada-002");

export async function findRelevantContent(userQuery: string) {
  try {
    // Generate embedding for the user query
    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: userQuery,
    });

    // Calculate cosine similarity
    const similarity = sql<number>`1 - (${cosineDistance(
      embeddings.embedding,
      queryEmbedding
    )})`;

    // Find the most similar embeddings
    const similarEmbeddings = await db
      .select({
        id: embeddings.id,
        content: embeddings.content,
        resourceId: embeddings.resourceId,
        similarity,
      })
      .from(embeddings)
      .where(gt(similarity, 0.5)) // Only return results with >50% similarity
      .orderBy((t) => desc(t.similarity))
      .limit(5);

    // Get the full resources for context
    const resourceIds = [...new Set(similarEmbeddings.map((e) => e.resourceId))];
    
    const relatedResources = await db
      .select()
      .from(resources)
      .where(
        sql`${resources.id} IN (${sql.join(
          resourceIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    return {
      success: true,
      results: similarEmbeddings.map((embedding) => ({
        content: embedding.content,
        similarity: embedding.similarity,
        resourceId: embedding.resourceId,
        resource: relatedResources.find((r) => r.id === embedding.resourceId),
      })),
    };
  } catch (error) {
    console.error("Error finding relevant content:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search knowledge base",
      results: [],
    };
  }
}

