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
    // Get current user's profile
    const myProfile = await getProfileByUserAndSession({
      userId: session.user.id,
      sessionId,
    });

    if (!myProfile) {
      return NextResponse.json(
        { error: "Profile not found. Create a profile first." },
        { status: 404 }
      );
    }

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
      targetField =
        searchField === "looking_for"
          ? "what_im_looking_for_embedding"
          : "what_i_offer_embedding";
      // Embedding will be generated inside searchProfilesByVector
    } else {
      // Default mode: match my "looking for" against their "offers"
      embedding = myProfile.whatImLookingForEmbedding as number[];
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

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to get discover feed:", error);
    return NextResponse.json(
      { error: "Failed to get discover feed" },
      { status: 500 }
    );
  }
}
