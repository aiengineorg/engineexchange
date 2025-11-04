import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { getProfileById, updateProfile } from "@/lib/db/queries";

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50),
  age: z.number().int().min(18).max(120),
  bio: z.string().max(500).optional().nullable(),
  images: z.array(z.string().url()).max(5),
  whatIOffer: z.string().min(10).max(1000),
  whatImLookingFor: z.string().min(10).max(1000),
});

// PATCH /api/profiles/[id] - Update a profile
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

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
      age,
      bio,
      images,
      whatIOffer,
      whatImLookingFor,
    } = validation.data;

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
      age,
      bio: bio || null,
      images,
      whatIOffer,
      whatIOfferEmbedding: offerEmbedding,
      whatImLookingFor,
      whatImLookingForEmbedding: lookingForEmbedding,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
