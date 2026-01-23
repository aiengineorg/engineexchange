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
  userLookingFor?: string; // User's "what I'm looking for" text for better match reasons
  targetField?: "what_i_offer_embedding" | "what_im_looking_for_embedding" | "both";
  limit?: number;
  minSimilarity?: number;
}

// Common words to ignore when extracting skills
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
  'was', 'one', 'our', 'out', 'has', 'have', 'been', 'would', 'could', 'their',
  'what', 'about', 'which', 'when', 'make', 'like', 'into', 'just', 'over',
  'such', 'some', 'than', 'them', 'well', 'only', 'come', 'its', 'also', 'back',
  'after', 'most', 'with', 'from', 'this', 'that', 'they', 'will', 'each',
  'looking', 'looking for', 'someone', 'people', 'person', 'help', 'want',
  'need', 'interested', 'experience', 'work', 'working', 'build', 'building',
  'create', 'creating', 'develop', 'developing', 'learn', 'learning', 'who',
  'how', 'years', 'year', 'more', 'other', 'very', 'good', 'great', 'best',
]);

/**
 * Extract meaningful skills/concepts from text
 */
function extractSkills(text: string): string[] {
  // Common tech/business skill patterns
  const skillPatterns = [
    /\b(react|vue|angular|svelte|next\.?js|nuxt)\b/gi,
    /\b(node\.?js|express|fastify|nest\.?js)\b/gi,
    /\b(python|java|go|rust|typescript|javascript|swift|kotlin)\b/gi,
    /\b(aws|gcp|azure|cloud|devops|kubernetes|docker)\b/gi,
    /\b(machine learning|ml|ai|deep learning|nlp|computer vision)\b/gi,
    /\b(product management|pm|product design|ux|ui)\b/gi,
    /\b(marketing|growth|sales|business development|bd)\b/gi,
    /\b(data science|data engineering|analytics|sql)\b/gi,
    /\b(mobile|ios|android|flutter|react native)\b/gi,
    /\b(blockchain|web3|crypto|defi|smart contracts)\b/gi,
    /\b(startup|founder|entrepreneur|vc|fundraising)\b/gi,
    /\b(backend|frontend|full.?stack|api|microservices)\b/gi,
    /\b(design|figma|sketch|branding|ui\/ux)\b/gi,
    /\b(saas|b2b|b2c|e-?commerce|fintech|healthtech|edtech)\b/gi,
  ];

  const skills: Set<string> = new Set();

  // Extract pattern matches
  for (const pattern of skillPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => skills.add(m.toLowerCase().trim()));
    }
  }

  // Also extract capitalized words/phrases that might be skills
  const words = text.split(/[\s,;]+/);
  for (const word of words) {
    const cleaned = word.replace(/[^\w\s.-]/g, '').trim();
    if (cleaned.length > 2 &&
        !STOP_WORDS.has(cleaned.toLowerCase()) &&
        /^[A-Z]/.test(word)) { // Starts with capital
      skills.add(cleaned);
    }
  }

  return Array.from(skills).slice(0, 10);
}

/**
 * Find overlapping concepts between two texts
 */
function findOverlappingConcepts(text1: string, text2: string): string[] {
  const skills1 = extractSkills(text1);
  const skills2 = extractSkills(text2);

  const overlaps: string[] = [];

  for (const skill1 of skills1) {
    for (const skill2 of skills2) {
      const s1 = skill1.toLowerCase();
      const s2 = skill2.toLowerCase();
      if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) {
        overlaps.push(skill1);
        break;
      }
    }
  }

  return [...new Set(overlaps)].slice(0, 3);
}

export interface ProfileSearchResult {
  id: string;
  userId: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  linkedinUrl?: string | null;
  websiteOrGithub?: string | null;
  hasTeam?: boolean | null;
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
    userLookingFor,
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
      p.linkedin_url as "linkedinUrl",
      p.website_or_github as "websiteOrGithub",
      p.has_team as "hasTeam",
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
    topRawSimilarity: rows[0] ? (rows[0] as Record<string, unknown>)?.similarity : 'none',
  });

  // Generate match reasons if custom query provided
  const cleanResults: ProfileSearchResult[] = rows.map((row: any) => {
    // Normalize similarity score for more intuitive display
    // Text embeddings typically cluster between 0.6-0.9 for related content
    // Use a higher baseline and power curve to create meaningful differentiation
    const rawSimilarity = row.similarity as number;

    // Use 0.65 as the effective floor (typical "noise" level for embeddings)
    // and apply a power curve to spread out the higher scores
    const effectiveFloor = 0.65;
    const effectiveCeiling = 0.95; // Very few matches exceed this

    // First, map raw score to 0-1 range using the effective floor/ceiling
    const linearNormalized = (rawSimilarity - effectiveFloor) / (effectiveCeiling - effectiveFloor);
    const clampedLinear = Math.max(0, Math.min(1, linearNormalized));

    // Apply square root to spread out lower scores (makes differences more visible)
    // Then scale to a reasonable range (20-95%) - never show 0% for returned results
    const normalizedSimilarity = 0.20 + (Math.sqrt(clampedLinear) * 0.75);

    const result: ProfileSearchResult = {
      id: row.id,
      userId: row.userId,
      displayName: row.displayName,
      images: row.images,
      whatIOffer: row.whatIOffer,
      whatImLookingFor: row.whatImLookingFor,
      linkedinUrl: row.linkedinUrl,
      websiteOrGithub: row.websiteOrGithub,
      hasTeam: row.hasTeam,
      similarity: normalizedSimilarity,
    };

    // Store which field was searched against for card reordering
    result.searchedField = targetField === "what_i_offer_embedding" 
      ? "what_i_offer" 
      : "what_im_looking_for";

    // Generate match reason - prioritize what they OFFER since that's what users care about
    const searchText = customQuery || userLookingFor || "";
    const theirOffers = row.whatIOffer || "";
    const theirLookingFor = row.whatImLookingFor || "";

    // Extract skills from their profile
    const theirSkills = extractSkills(theirOffers);
    const theirNeeds = extractSkills(theirLookingFor);
    const offersOverlap = findOverlappingConcepts(searchText, theirOffers);

    // Build match reason - use profile ID hash for consistent but varied templates
    const hash = row.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    let matchReason = "";

    if (offersOverlap.length > 0) {
      // Direct match: they offer what user is looking for
      const skills = offersOverlap.slice(0, 2);
      const directTemplates = [
        `Their ${skills[0]} expertise aligns with your goals${skills[1] ? `, plus ${skills[1]} experience` : ""}.`,
        `A match for your ${skills[0]} interests${skills[1] ? ` — also skilled in ${skills[1]}` : ""}.`,
        `${skills[0]} specialist${skills[1] ? ` with ${skills[1]} background` : ""} that fits your needs.`,
      ];
      matchReason = directTemplates[hash % directTemplates.length];
    } else if (theirSkills.length >= 2) {
      const s1 = theirSkills[0];
      const s2 = theirSkills[1];
      const s3 = theirSkills[2];
      const twoSkillTemplates = [
        `${s1} professional with ${s2} expertise.`,
        `Background in ${s1} and ${s2}.`,
        `Works across ${s1} and ${s2}.`,
        `${s1} focus, complemented by ${s2}.`,
        `Skilled in both ${s1} and ${s2}.`,
        s3 ? `${s1}, ${s2}, and ${s3} experience.` : `Combines ${s1} with ${s2}.`,
      ];
      matchReason = twoSkillTemplates[hash % twoSkillTemplates.length];
    } else if (theirSkills.length === 1) {
      const skill = theirSkills[0];
      const oneSkillTemplates = [
        `${skill} specialist.`,
        `Focused on ${skill}.`,
        `Deep ${skill} expertise.`,
        `${skill} background.`,
      ];
      matchReason = oneSkillTemplates[hash % oneSkillTemplates.length];
    } else {
      // No skills extracted - use first sentence of their offer
      const firstSentence = theirOffers.split(/[.!?]/)[0]?.trim() || "";
      if (firstSentence.length > 80) {
        matchReason = firstSentence.substring(0, 80) + "...";
      } else if (firstSentence) {
        matchReason = firstSentence;
        if (!matchReason.endsWith(".")) matchReason += ".";
      } else {
        matchReason = "Potential collaboration opportunity.";
      }
    }

    // Optionally append what they're seeking
    if (theirNeeds.length > 0 && matchReason.length < 60) {
      const need = theirNeeds[0];
      if (!matchReason.toLowerCase().includes(need.toLowerCase())) {
        const seekingTemplates = [
          ` Looking for ${need} help.`,
          ` Seeking ${need} collaborators.`,
          ` Wants to connect on ${need}.`,
        ];
        matchReason = matchReason.replace(/\.$/, "") + seekingTemplates[hash % seekingTemplates.length];
      }
    }

    result.matchReason = matchReason;

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
      p.linkedin_url as "linkedinUrl",
      p.website_or_github as "websiteOrGithub",
      p.has_team as "hasTeam",
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
    linkedinUrl: row.linkedinUrl,
    websiteOrGithub: row.websiteOrGithub,
    hasTeam: row.hasTeam,
    similarity: row.similarity,
  }));

  return cleanResults;
}
