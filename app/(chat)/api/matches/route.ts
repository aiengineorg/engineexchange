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

    // Remove embeddings from otherProfile in each match (not JSON serializable)
    // and generate match reasons
    const cleanMatches = matches.map((m) => {
      const { whatIOfferEmbedding, whatImLookingForEmbedding, ...otherProfile } = m.otherProfile;
      
      // Generate match reason: default matching is "my looking for" vs "their offers"
      // Extract a relevant sentence from their "What I Offer" that relates to my "What I'm Looking For"
      const myLookingFor = myProfile.whatImLookingFor.toLowerCase();
      const theirOffer = otherProfile.whatIOffer;
      
      // Find sentences in their offer that might relate to what I'm looking for
      const sentences = theirOffer.split(/[.!?]\s+/);
      const myKeywords = myLookingFor.split(/\s+/).filter(w => w.length > 3);
      
      const relevantSentences = sentences.filter((sentence: string) => {
        const lowerSentence = sentence.toLowerCase();
        return myKeywords.some(keyword => lowerSentence.includes(keyword));
      });

      let matchReason: string;
      if (relevantSentences.length > 0) {
        let matchText = relevantSentences[0].trim();
        if (matchText.length > 150) {
          matchText = matchText.substring(0, 150) + "...";
        }
        matchReason = `This person offers: "${matchText}"`;
      } else {
        matchReason = `This person offers what you're looking for`;
      }

      return {
        ...m,
        otherProfile: {
          ...otherProfile,
          matchReason,
          searchedField: "what_i_offer" as const,
        },
      };
    });

    return NextResponse.json(cleanMatches);
  } catch (error) {
    console.error("Failed to get matches:", error);
    return NextResponse.json(
      { error: "Failed to get matches" },
      { status: 500 }
    );
  }
}
