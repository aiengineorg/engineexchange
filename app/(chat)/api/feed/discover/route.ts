import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProfileByUserAndSession, getSwipesByProfile } from "@/lib/db/queries";
import { searchProfilesByVector } from "@/lib/matching/vector-search";

// GET /api/feed/discover?sessionId={id}&query={text}&searchField={field}
// Returns profiles ordered by vector similarity
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const customQuery = searchParams.get("query");
  const searchField = searchParams.get("searchField") || "offers";

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  try {
    console.log("🔍 Discover feed request:", { sessionId, customQuery, searchField });
    
    // Get current user's profile
    const myProfile = await getProfileByUserAndSession({
      userId: session.user.id,
      sessionId,
    });

    if (!myProfile) {
      console.error("❌ Profile not found for user:", session.user.id);
      return NextResponse.json(
        { error: "Profile not found. Create a profile first." },
        { status: 404 }
      );
    }
    
    console.log("✅ Found user profile:", myProfile.id);

    // Get profiles user has already swiped on
    const swipes = await getSwipesByProfile(myProfile.id);
    const excludeProfileIds = [
      myProfile.id,
      ...swipes.map((s) => s.targetUserId),
    ];

    // Determine search parameters
    let embedding: number[] | undefined;
    let targetField: "what_i_offer_embedding" | "what_im_looking_for_embedding";

    if (customQuery) {
      // Custom search mode: user typed their own query
      console.log("🔍 Using custom query mode");
      targetField =
        searchField === "looking_for"
          ? "what_im_looking_for_embedding"
          : "what_i_offer_embedding";
      // Embedding will be generated inside searchProfilesByVector
    } else {
      // Default mode: match my "looking for" against their "offers"
      console.log("📊 Using profile embedding for matching");
      const lookingForEmbedding = myProfile.whatImLookingForEmbedding;
      
      console.log("🔍 Embedding check:", {
        hasEmbedding: !!lookingForEmbedding,
        isArray: Array.isArray(lookingForEmbedding),
        isObject: typeof lookingForEmbedding === 'object',
        length: lookingForEmbedding ? (Array.isArray(lookingForEmbedding) ? lookingForEmbedding.length : 'not array') : 'null',
        constructor: lookingForEmbedding?.constructor?.name,
      });
      
      // Convert pgvector to array if needed
      let embeddingArray: number[] | null = null;
      if (lookingForEmbedding) {
        if (Array.isArray(lookingForEmbedding)) {
          embeddingArray = lookingForEmbedding;
        } else if (typeof lookingForEmbedding === 'string') {
          // Sometimes pgvector returns as string "[1,2,3,...]"
          try {
            embeddingArray = JSON.parse(lookingForEmbedding);
          } catch (e) {
            console.error("Failed to parse embedding string:", e);
          }
        } else if (typeof lookingForEmbedding === 'object') {
          // pgvector might return as object, try to convert
          embeddingArray = Object.values(lookingForEmbedding);
        }
      }
      
      if (!embeddingArray || embeddingArray.length === 0) {
        console.error("❌ Profile missing valid whatImLookingForEmbedding:", {
          profileId: myProfile.id,
          embeddingArray,
        });
        return NextResponse.json(
          { error: "Profile embeddings not ready. Please try again in a moment." },
          { status: 503 }
        );
      }
      
      console.log("✅ Successfully extracted embedding array:", embeddingArray.length);
      embedding = embeddingArray;
      targetField = "what_i_offer_embedding";
    }

    // Perform vector search
    const profiles = await searchProfilesByVector({
      sessionId,
      excludeProfileIds,
      embedding,
      customQuery: customQuery || undefined,
      targetField,
      limit: 50,
      minSimilarity: 0.5,
    });

    // searchProfilesByVector already returns clean ProfileSearchResult objects
    // without embedding fields, so they're safe to serialize
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to get discover feed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { 
        error: "Failed to get discover feed",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
