import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProfileByUserAndSession } from "@/lib/db/queries";
import { searchProfilesByVector } from "@/lib/matching/vector-search";
import { profiles, user } from "@/lib/db/schema";
import { eq, and, inArray, ne } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// GET /api/profiles/directory?sessionId={id}&query={text}&searchField={field}
// Returns all profiles in a session with optional search/filter
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
    // Get current user's profile to exclude it from results
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

    let profileResults: Array<{
      id: string;
      displayName: string;
      whatIOffer: string;
      whatImLookingFor: string;
      images: string[];
      userId: string;
      discordId: string | null;
      linkedinUrl?: string | null;
      websiteOrGithub?: string | null;
      hasTeam?: boolean | null;
      similarity?: number;
      searchedField?: "what_i_offer" | "what_im_looking_for";
    }>;

    if (customQuery) {
      // Use vector search if query is provided
      // Semantic matching: 
      // - "What I'm Looking For" searches against their "What I Offer"
      // - "What I Offer" searches against their "What I'm Looking For"
      const targetField =
        searchField === "looking_for"
          ? "what_i_offer_embedding"  // I'm looking for what they offer
          : "what_im_looking_for_embedding";  // I offer what they're looking for
      
      console.log("🔍 Directory search:", { customQuery, searchField, targetField });
      
      const searchResults = await searchProfilesByVector({
        sessionId,
        excludeProfileIds: [myProfile.id],
        customQuery,
        targetField,
        limit: 100,
        minSimilarity: 0.3, // Lower threshold for directory
      });

      // Get Discord IDs for all profiles
      const userIds = searchResults.map((p) => p.userId);
      const users = userIds.length > 0
        ? await db
            .select({ id: user.id, discordId: user.discordId })
            .from(user)
            .where(inArray(user.id, userIds))
        : [];

      const discordMap = new Map(users.map((u) => [u.id, u.discordId]));

      profileResults = searchResults.map((result) => ({
        id: result.id,
        displayName: result.displayName,
        whatIOffer: result.whatIOffer,
        whatImLookingFor: result.whatImLookingFor,
        images: result.images || [],
        userId: result.userId,
        discordId: discordMap.get(result.userId) || null,
        linkedinUrl: result.linkedinUrl,
        websiteOrGithub: result.websiteOrGithub,
        hasTeam: result.hasTeam,
        similarity: result.similarity,
        searchedField: result.searchedField,
      }));
    } else {
      // Get all profiles in session (excluding current user)
      const allProfiles = await db
        .select({
          id: profiles.id,
          displayName: profiles.displayName,
          whatIOffer: profiles.whatIOffer,
          whatImLookingFor: profiles.whatImLookingFor,
          images: profiles.images,
          userId: profiles.userId,
          linkedinUrl: profiles.linkedinUrl,
          websiteOrGithub: profiles.websiteOrGithub,
          hasTeam: profiles.hasTeam,
        })
        .from(profiles)
        .where(
          and(
            eq(profiles.sessionId, sessionId),
            ne(profiles.id, myProfile.id)
          )
        )
        .orderBy(profiles.createdAt);

      // Get Discord IDs for all profiles
      const userIds = allProfiles.map((p) => p.userId);
      const users = userIds.length > 0
        ? await db
            .select({ id: user.id, discordId: user.discordId })
            .from(user)
            .where(inArray(user.id, userIds))
        : [];

      const discordMap = new Map(users.map((u) => [u.id, u.discordId]));

      profileResults = allProfiles.map((profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        whatIOffer: profile.whatIOffer,
        whatImLookingFor: profile.whatImLookingFor,
        images: profile.images || [],
        userId: profile.userId,
        discordId: discordMap.get(profile.userId) || null,
        linkedinUrl: profile.linkedinUrl,
        websiteOrGithub: profile.websiteOrGithub,
        hasTeam: profile.hasTeam,
      }));
    }

    // Exclude embeddings from response
    return NextResponse.json(profileResults);
  } catch (error) {
    console.error("Failed to get directory profiles:", error);
    return NextResponse.json(
      { error: "Failed to get directory profiles" },
      { status: 500 }
    );
  }
}

