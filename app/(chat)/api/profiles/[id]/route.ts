import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { getProfileById, updateProfile } from "@/lib/db/queries";
import {
  enrichPersonWithClay,
  generateLinkedInSummary,
} from "@/lib/clay/enrichment";

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50),
  images: z.array(z.string().url()).max(5),
  whatIOffer: z.string().min(10).max(1000),
  whatImLookingFor: z.string().min(10).max(1000),
  linkedinUrl: z.string().url().optional(),
  websiteOrGithub: z.string().url().optional(),
  hasTeam: z.boolean().optional(),
});

// GET /api/profiles/[id] - Get a profile by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const profile = await getProfileById(id);

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

// PATCH /api/profiles/[id] - Update a profile
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify profile exists and belongs to user
    const existingProfile = await getProfileById(id);

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (existingProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = UpdateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      displayName,
      images,
      whatIOffer,
      whatImLookingFor,
      linkedinUrl,
      websiteOrGithub,
      hasTeam,
    } = validation.data;

    // Enrich with Clay if LinkedIn URL is provided and different from existing
    let linkedinEnrichmentSummary: string | undefined = existingProfile.linkedinEnrichmentSummary ?? undefined;
    if (linkedinUrl && linkedinUrl !== existingProfile.linkedinUrl) {
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
        // Continue without enrichment - don't fail profile update
      }
    }

    // Regenerate embeddings if text changed
    const needsOfferEmbedding = whatIOffer !== existingProfile.whatIOffer;
    const needsLookingForEmbedding =
      whatImLookingFor !== existingProfile.whatImLookingFor;

    let offerEmbedding = existingProfile.whatIOfferEmbedding as number[];
    let lookingForEmbedding = existingProfile.whatImLookingForEmbedding as number[];

    if (needsOfferEmbedding || needsLookingForEmbedding) {
      console.log("Regenerating embeddings for profile...");
      const embeddings = await Promise.all([
        needsOfferEmbedding
          ? generateEmbedding(whatIOffer)
          : Promise.resolve(offerEmbedding),
        needsLookingForEmbedding
          ? generateEmbedding(whatImLookingFor)
          : Promise.resolve(lookingForEmbedding),
      ]);

      [offerEmbedding, lookingForEmbedding] = embeddings;
    }

    // Update profile
    const updatedProfile = await updateProfile({
      id,
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
    });

    // Exclude embeddings from response (they're not JSON serializable and not needed by client)
    const { whatIOfferEmbedding: _offer, whatImLookingForEmbedding: _looking, ...profileData } = updatedProfile;
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
