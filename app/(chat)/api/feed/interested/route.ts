import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProfileByUserAndSession, getSwipesByProfile } from "@/lib/db/queries";
import { getInterestedProfiles } from "@/lib/matching/vector-search";

// GET /api/feed/interested?sessionId={id}
// Returns profiles that swiped "yes" on current user
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

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
    const excludeProfileIds = swipes.map((s) => s.targetUserId);

    // Get profiles interested in me
    const profiles = await getInterestedProfiles({
      profileId: myProfile.id,
      sessionId,
      excludeProfileIds,
      limit: 50,
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to get interested feed:", error);
    return NextResponse.json(
      { error: "Failed to get interested feed" },
      { status: 500 }
    );
  }
}
