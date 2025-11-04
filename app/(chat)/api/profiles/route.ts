import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { generateEmbedding } from "@/lib/ai/embeddings";
import {
  createProfile,
  getProfileByUserAndSession,
  getSessionById,
} from "@/lib/db/queries";

const CreateProfileSchema = z.object({
  sessionId: z.string().uuid(),
  displayName: z.string().min(1).max(50),
  age: z.number().int().min(18).max(120),
  bio: z.string().max(500).optional().nullable(),
  images: z.array(z.string().url()).max(5).default([]),
  whatIOffer: z.string().min(10).max(1000),
  whatImLookingFor: z.string().min(10).max(1000),
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
      age,
      bio,
      images,
      whatIOffer,
      whatImLookingFor,
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

    // Generate embeddings
    console.log("Generating embeddings for profile...");
    const [offerEmbedding, lookingForEmbedding] = await Promise.all([
      generateEmbedding(whatIOffer),
      generateEmbedding(whatImLookingFor),
    ]);

    // Create profile
    const profile = await createProfile({
      userId: session.user.id,
      sessionId,
      displayName,
      age,
      bio: bio || null,
      images,
      whatIOffer,
      whatIOfferEmbedding: offerEmbedding,
      whatImLookingFor,
      whatImLookingForEmbedding: lookingForEmbedding,
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to create profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
