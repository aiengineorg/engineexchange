import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { generateEmbedding } from "@/lib/ai/embeddings";
import {
  createProfile,
  getProfileByUserAndSession,
  getSessionById,
} from "@/lib/db/queries";
import {
  enrichPersonWithClay,
  generateLinkedInSummary,
} from "@/lib/clay/enrichment";

const CreateProfileSchema = z.object({
  sessionId: z.string().uuid(),
  displayName: z.string().min(1).max(50),
  images: z.array(z.string().url()).max(5).default([]),
  whatIOffer: z.string().min(10).max(1000),
  whatImLookingFor: z.string().min(10).max(1000),
  linkedinUrl: z.string().url().optional(),
  websiteOrGithub: z.string().url().optional(),
  hasTeam: z.boolean().optional(),
  contactEmail: z.string().email().optional(),
});

// POST /api/profiles - Create a new profile
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = CreateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      sessionId,
      displayName,
      images,
      whatIOffer,
      whatImLookingFor,
      linkedinUrl,
      websiteOrGithub,
      hasTeam,
      contactEmail,
    } = validation.data;

    // Verify session exists
    const matchingSession = await getSessionById(sessionId);
    if (!matchingSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if user already has a profile in this session
    const existingProfile = await getProfileByUserAndSession({
      userId: session.user.id,
      sessionId,
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists for this session" },
        { status: 409 }
      );
    }

    // Enrich with Clay if LinkedIn URL is provided
    let linkedinEnrichmentSummary: string | undefined;
    if (linkedinUrl) {
      console.log("Enriching profile with Clay using LinkedIn URL:", linkedinUrl);
      try {
        const enrichmentResult = await enrichPersonWithClay({
          linkedinUrl,
          name: displayName,
        });

        if (enrichmentResult.success && enrichmentResult.data) {
          linkedinEnrichmentSummary = generateLinkedInSummary(enrichmentResult.data);
          console.log("✅ LinkedIn enrichment successful:", {
            hasSummary: !!linkedinEnrichmentSummary,
            summaryLength: linkedinEnrichmentSummary?.length,
          });
        } else {
          console.warn("⚠️ LinkedIn enrichment failed:", enrichmentResult.error);
        }
      } catch (error) {
        console.error("Failed to enrich with Clay:", error);
        // Continue without enrichment - don't fail profile creation
      }
    }

    // Generate embeddings
    console.log("Generating embeddings for profile...");
    const [offerEmbedding, lookingForEmbedding] = await Promise.all([
      generateEmbedding(whatIOffer),
      generateEmbedding(whatImLookingFor),
    ]);
    console.log("✅ Embeddings generated:", {
      offerEmbeddingLength: offerEmbedding.length,
      lookingForEmbeddingLength: lookingForEmbedding.length,
      offerEmbeddingSample: offerEmbedding.slice(0, 3),
      lookingForEmbeddingSample: lookingForEmbedding.slice(0, 3),
    });

    // Create profile
    console.log("Saving profile to database with embeddings...");
    const profile = await createProfile({
      userId: session.user.id,
      sessionId,
      displayName,
      images,
      whatIOffer,
      whatIOfferEmbedding: offerEmbedding,
      whatImLookingFor,
      whatImLookingForEmbedding: lookingForEmbedding,
      linkedinUrl,
      linkedinEnrichmentSummary,
      websiteOrGithub,
      hasTeam,
      contactEmail,
    });
    console.log("✅ Profile saved successfully with ID:", profile.id);

    // Exclude embeddings from response (they're not JSON serializable and not needed by client)
    const { whatIOfferEmbedding: _offer, whatImLookingForEmbedding: _looking, ...profileData } = profile;
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Failed to create profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
