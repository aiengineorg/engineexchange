import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProfileByUserAndSession, getUserIdsWithProfileInSession, createProfile } from "@/lib/db/queries";
import { BFL_HACK_SESSION_ID } from "@/lib/constants";

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
    let profile = await getProfileByUserAndSession({
      userId: session.user.id,
      sessionId,
    });

    // Auto-migrate: if no profile in current session, copy from BFL Hack session
    if (!profile && sessionId !== BFL_HACK_SESSION_ID) {
      const previousProfile = await getProfileByUserAndSession({
        userId: session.user.id,
        sessionId: BFL_HACK_SESSION_ID,
      });

      if (previousProfile) {
        profile = await createProfile({
          userId: session.user.id,
          sessionId,
          displayName: previousProfile.displayName,
          images: previousProfile.images || [],
          whatIOffer: previousProfile.whatIOffer,
          whatIOfferEmbedding: previousProfile.whatIOfferEmbedding || [],
          whatImLookingFor: previousProfile.whatImLookingFor,
          whatImLookingForEmbedding: previousProfile.whatImLookingForEmbedding || [],
          linkedinUrl: previousProfile.linkedinUrl || undefined,
          linkedinEnrichmentSummary: previousProfile.linkedinEnrichmentSummary || undefined,
          websiteOrGithub: previousProfile.websiteOrGithub || undefined,
          hasTeam: false, // Reset team status for new session
          contactEmail: previousProfile.contactEmail || undefined,
        });
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Exclude embeddings from response (they're not JSON serializable and not needed by client)
    const { whatIOfferEmbedding, whatImLookingForEmbedding, ...profileData } = profile;

    // Check BFL Hack alumni status (only for non-BFL sessions)
    let isBflAlumni = false;
    if (sessionId !== BFL_HACK_SESSION_ID) {
      const alumni = await getUserIdsWithProfileInSession([session.user.id], BFL_HACK_SESSION_ID);
      isBflAlumni = alumni.has(session.user.id);
    }

    return NextResponse.json({ ...profileData, isBflAlumni });
  } catch (error) {
    console.error("Failed to get profile:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}
