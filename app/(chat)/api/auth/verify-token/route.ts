import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  verifyEmailToken,
  linkParticipantToUser,
} from "@/lib/db/queries";

const VerifyTokenSchema = z.object({
  token: z.string().length(6),
});

// POST /api/auth/verify-token - Verify the 6-digit code
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = VerifyTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Verify the token
    const result = await verifyEmailToken(session.user.id, token);

    if (!result.success || !result.participant) {
      return NextResponse.json(
        { error: result.error || "Verification failed" },
        { status: 400 }
      );
    }

    // Link participant to user
    await linkParticipantToUser(session.user.id, result.participant.id);

    // Return participant data for profile hydration
    return NextResponse.json({
      success: true,
      participant: {
        name: result.participant.name,
        email: result.participant.email,
        linkedin: result.participant.linkedin,
        websiteOrGithub: result.participant.websiteOrGithub,
        profileSummary: result.participant.profileSummary,
      },
    });
  } catch (error) {
    console.error("Failed to verify token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
