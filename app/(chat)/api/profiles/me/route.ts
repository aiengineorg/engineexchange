import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProfileByUserAndSession } from "@/lib/db/queries";

// GET /api/profiles/me?sessionId={id} - Get current user's profile in a session
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
    const profile = await getProfileByUserAndSession({
      userId: session.user.id,
      sessionId,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Exclude embeddings from response (they're not JSON serializable and not needed by client)
    const { whatIOfferEmbedding, whatImLookingForEmbedding, ...profileData } = profile;
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Failed to get profile:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}
