import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getMatchesByProfile, getProfileByUserAndSession } from "@/lib/db/queries";

// GET /api/matches?sessionId={id} - Get all matches for current user
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
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get all matches
    const matches = await getMatchesByProfile(myProfile.id);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to get matches:", error);
    return NextResponse.json(
      { error: "Failed to get matches" },
      { status: 500 }
    );
  }
}
