import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getHackathonParticipantByEmail,
  saveEmailVerificationToken,
} from "@/lib/db/queries";
import {
  createResendClient,
  generateVerificationCodeEmailHtml,
  generateVerificationCodeEmailText,
} from "@/lib/email/resend";

const SendVerificationSchema = z.object({
  email: z.string().email(),
});

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-verification - Send verification code to email
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
      return NextResponse.json(
        { error: "This email is not registered for the hackathon. Please use the email you registered with on Luma." },
        { status: 404 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save token to user
    await saveEmailVerificationToken(session.user.id, email, code, expiresAt);

    // Send email
    const resend = createResendClient();
    await resend.sendEmail({
      to: email,
      subject: "Your BFL Hackathon Verification Code",
      html: generateVerificationCodeEmailHtml({ code }),
      text: generateVerificationCodeEmailText({ code }),
    });

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      participantName: participant.name,
    });
  } catch (error) {
    console.error("Failed to send verification:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
