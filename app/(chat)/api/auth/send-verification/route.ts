import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getHackathonParticipantByEmail,
  linkParticipantToUser,
} from "@/lib/db/queries";

const SendVerificationSchema = z.object({
  email: z.string().email(),
});

// POST /api/auth/send-verification - Verify email by looking up participant directly (no code/email step)
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = SendVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if email exists in hackathon participants
    const participant = await getHackathonParticipantByEmail(email);

    if (!participant) {
      // Email not found — allow manual entry, no error
      return NextResponse.json({
        success: true,
        found: false,
        message: "Email not found in registrations. You can fill in your details manually.",
      });
    }

    // Link participant to user directly (skip email verification)
    await linkParticipantToUser(session.user.id, participant.id);

    return NextResponse.json({
      success: true,
      found: true,
      message: "Email verified",
      participantName: participant.name,
      participant: {
        name: participant.name,
        email: participant.email,
        linkedin: participant.linkedin,
        websiteOrGithub: participant.websiteOrGithub,
        profileSummary: participant.profileSummary,
        hasTeam: participant.hasTeam,
      },
    });
  } catch (error) {
    console.error("Failed to verify email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
