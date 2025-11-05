import "server-only";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { profiles } from "@/lib/db/schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface VectorSearchParams {
  sessionId: string;
  excludeProfileIds: string[];
  embedding?: number[];
  customQuery?: string;
  targetField?: "what_i_offer_embedding" | "what_im_looking_for_embedding";
  limit?: number;
  minSimilarity?: number;
}

export interface ProfileSearchResult {
  id: string;
  userId: string;
  displayName: string;
  age: number;
  bio: string | null;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  similarity: number;
}

/**
 * Perform vector similarity search on profiles
 * Returns profiles ordered by cosine similarity to the query embedding
 */
export async function searchProfilesByVector(
  params: VectorSearchParams
): Promise<ProfileSearchResult[]> {
  const {
    sessionId,
    excludeProfileIds,
    embedding: providedEmbedding,
    customQuery,
    targetField = "what_i_offer_embedding",
    limit = 50,
    minSimilarity = 0.5,
  } = params;

  // Generate embedding if custom query provided
  let queryEmbedding = providedEmbedding;
  if (customQuery && !providedEmbedding) {
    console.log("🔍 Generating embedding for custom query:", customQuery.substring(0, 50) + "...");
    queryEmbedding = await generateEmbedding(customQuery);
  }

  if (!queryEmbedding) {
    throw new Error("Either embedding or customQuery must be provided");
  }

  console.log("🎯 Performing vector search with:", {
    sessionId,
    excludeCount: excludeProfileIds.length,
    embeddingLength: queryEmbedding.length,
    targetField,
    limit,
    minSimilarity,
  });

  // Convert embedding array to pgvector format
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Build exclude list SQL
  const excludeList =
    excludeProfileIds.length > 0
      ? sql`AND p.id NOT IN (${sql.join(
          excludeProfileIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      : sql``;

  // Vector similarity search query
  const results = await db.execute(sql`
    SELECT
      p.id,
      p.user_id as "userId",
      p.display_name as "displayName",
      p.age,
      p.bio,
      p.images,
      p.what_i_offer as "whatIOffer",
      p.what_im_looking_for as "whatImLookingFor",
      1 - (p.${sql.raw(targetField)} <=> ${embeddingStr}::vector) as similarity
    FROM profiles p
    WHERE p.session_id = ${sessionId}
      ${excludeList}
      AND (1 - (p.${sql.raw(targetField)} <=> ${embeddingStr}::vector)) > ${minSimilarity}
    ORDER BY p.${sql.raw(targetField)} <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);

  console.log("🔍 Raw results type:", typeof results, Array.isArray(results));
  
  // drizzle-orm execute returns results directly as an array
  const rows = (Array.isArray(results) ? results : []) as unknown[];
  
  console.log("✅ Vector search completed:", {
    resultsFound: rows.length,
    topProfile: rows[0] ? (rows[0] as Record<string, unknown>)?.displayName : 'none',
  });

  // Explicitly clean results to ensure no pgvector objects leak through
  const cleanResults: ProfileSearchResult[] = rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    age: row.age,
    bio: row.bio,
    images: row.images,
    whatIOffer: row.whatIOffer,
    whatImLookingFor: row.whatImLookingFor,
    similarity: row.similarity,
  }));

  return cleanResults;
}

/**
 * Get profiles that swiped "yes" on the given profile
 * (Interested in Me feed)
 */
export async function getInterestedProfiles(params: {
  profileId: string;
  sessionId: string;
  excludeProfileIds: string[];
  limit?: number;
}): Promise<ProfileSearchResult[]> {
  const { profileId, sessionId, excludeProfileIds, limit = 50 } = params;

  const excludeList =
    excludeProfileIds.length > 0
      ? sql`AND p.id NOT IN (${sql.join(
          excludeProfileIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      : sql``;

  const results = await db.execute(sql`
    SELECT
      p.id,
      p.user_id as "userId",
      p.display_name as "displayName",
      p.age,
      p.bio,
      p.images,
      p.what_i_offer as "whatIOffer",
      p.what_im_looking_for as "whatImLookingFor",
      0.0 as similarity
    FROM profiles p
    INNER JOIN swipes s ON s.swiping_user_id = p.id
    WHERE s.target_user_id = ${profileId}
      AND s.session_id = ${sessionId}
      AND s.decision = 'yes'
      ${excludeList}
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `);

  // drizzle-orm execute returns results directly as an array
  const rows = (Array.isArray(results) ? results : []) as unknown[];

  // Explicitly clean results to ensure no pgvector objects leak through
  const cleanResults: ProfileSearchResult[] = rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    age: row.age,
    bio: row.bio,
    images: row.images,
    whatIOffer: row.whatIOffer,
    whatImLookingFor: row.whatImLookingFor,
    similarity: row.similarity,
  }));

  return cleanResults;
}
