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
  targetField?: "what_i_offer_embedding" | "what_im_looking_for_embedding" | "both";
  limit?: number;
  minSimilarity?: number;
}

export interface ProfileSearchResult {
  id: string;
  userId: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  similarity: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
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

  // Generate match reasons if custom query provided
  const cleanResults: ProfileSearchResult[] = rows.map((row: any) => {
    const result: ProfileSearchResult = {
      id: row.id,
      userId: row.userId,
      displayName: row.displayName,
      images: row.images,
      whatIOffer: row.whatIOffer,
      whatImLookingFor: row.whatImLookingFor,
      similarity: row.similarity,
    };

    // Store which field was searched against for card reordering
    result.searchedField = targetField === "what_i_offer_embedding" 
      ? "what_i_offer" 
      : "what_im_looking_for";

    // Generate match reason
    if (customQuery) {
      const targetText = targetField === "what_i_offer_embedding" 
        ? row.whatIOffer 
        : row.whatImLookingFor;
      
      // Extract relevant phrases - improved keyword matching
      // Normalize query: remove punctuation, split into words, filter meaningful words
      const normalizedQuery = customQuery.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2); // Lower threshold to catch more words
      
      // Normalize target text and split into sentences
      const sentences = targetText.split(/[.!?]\s+/);
      
      // Find sentences that contain query keywords (more flexible matching)
      const relevantSentences = sentences.filter((sentence: string) => {
        const normalizedSentence = sentence.toLowerCase().replace(/[^\w\s]/g, ' ');
        const sentenceWords = normalizedSentence.split(/\s+/);
        
        // Check if any query word appears in the sentence (allowing partial matches)
        return normalizedQuery.some(queryWord => {
          // Exact word match
          if (sentenceWords.includes(queryWord)) return true;
          // Word contains query (for compound words)
          if (sentenceWords.some(word => word.includes(queryWord) || queryWord.includes(word))) return true;
          // Check if sentence contains the query word as substring
          return normalizedSentence.includes(queryWord);
        });
      });

      if (relevantSentences.length > 0) {
        // Take the first relevant sentence
        let matchText = relevantSentences[0].trim();
        if (matchText.length > 150) {
          matchText = matchText.substring(0, 150) + "...";
        }
        
        // Set match reason based on what was searched
        if (targetField === "what_i_offer_embedding") {
          // Searched their "What I Offer" - so show what they offer
          result.matchReason = `This person offers: "${matchText}"`;
        } else {
          // Searched their "What I'm Looking For" - so show what they're looking for
          result.matchReason = `This person is looking for: "${matchText}"`;
        }
      } else {
        // Fallback: show first sentence or first 150 chars of the matched field
        let fallbackText = targetText.trim();
        const firstSentence = fallbackText.split(/[.!?]\s+/)[0];
        if (firstSentence && firstSentence.length > 20) {
          fallbackText = firstSentence;
        }
        if (fallbackText.length > 150) {
          fallbackText = fallbackText.substring(0, 150) + "...";
        }
        
        if (targetField === "what_i_offer_embedding") {
          result.matchReason = `This person offers: "${fallbackText}"`;
        } else {
          result.matchReason = `This person is looking for: "${fallbackText}"`;
        }
      }
    } else {
      // Default mode: match my "looking for" against their "offers"
      // Show first sentence from their "What I Offer"
      let defaultText = row.whatIOffer.trim();
      const firstSentence = defaultText.split(/[.!?]\s+/)[0];
      if (firstSentence && firstSentence.length > 20) {
        defaultText = firstSentence;
      }
      if (defaultText.length > 150) {
        defaultText = defaultText.substring(0, 150) + "...";
      }
      result.matchReason = `This person offers: "${defaultText}"`;
    }

    return result;
  });

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
    images: row.images,
    whatIOffer: row.whatIOffer,
    whatImLookingFor: row.whatImLookingFor,
    similarity: row.similarity,
  }));

  return cleanResults;
}
