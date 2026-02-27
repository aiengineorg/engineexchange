import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { z } from "zod";
import {
  buildProfileSummary,
  parseRegistrationAnswers,
} from "@/lib/luma/helpers";

// Schema for Luma webhook payload
const LumaWebhookSchema = z.object({
  event_type: z.string(),
  data: z.object({
    id: z.string(), // guest ID (api_id)
    user_email: z.string().email(),
    user_name: z.string().nullable().optional(),
    registration_answers: z
      .array(
        z.object({
          question_id: z.string().optional(),
          question_label: z.string().optional(),
          answer: z.string().optional(),
        })
      )
      .optional(),
  }).passthrough(),
});

/**
 * Verify Luma webhook signature
 * Luma signs webhooks with HMAC-SHA256 using the webhook secret
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Compare signatures (constant-time comparison to prevent timing attacks)
  return signature === expectedSignature;
}

// POST /api/luma-webhook - Receives Luma webhook events
export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.LUMA_WEBHOOK_SECRET;

    // Get raw body
    const rawBody = await request.text();

    // Optional signature verification (if LUMA_WEBHOOK_SECRET is set)
    if (webhookSecret) {
      const signature = request.headers.get("x-luma-signature");
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse and validate payload
    const body = JSON.parse(rawBody);
    const validation = LumaWebhookSchema.safeParse(body);

    if (!validation.success) {
      console.error("Invalid webhook payload:", validation.error);
      return NextResponse.json(
        { error: "Invalid payload", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { event_type, data } = validation.data;

    // Only process guest.registered events
    if (event_type !== "guest.registered") {
      console.log(`Ignoring event type: ${event_type}`);
      return NextResponse.json({ success: true, message: "Event ignored" });
    }

    console.log("Processing guest.registered event:", {
      guestId: data.id,
      email: data.user_email,
      name: data.user_name,
    });

    // Extract data from registration answers
    const answers = parseRegistrationAnswers(data.registration_answers);

    const linkedin = answers["What is your LinkedIn profile?"] || null;
    const websiteOrGithub =
      answers["Link to personal website/github/portfolio"] || null;
    const hasTeamAnswer =
      answers["Are you applying as a team? (max 4 per team)"];
    const hasTeam = hasTeamAnswer?.toLowerCase() === "yes";

    // Build profile summary from registration answers
    const profileSummary = buildProfileSummary(answers);

    // Import database function dynamically to avoid issues with server-only code
    const { createHackathonParticipant } = await import("@/lib/db/queries");

    // Create participant (will skip if email already exists)
    const participant = await createHackathonParticipant({
      name: data.user_name || null,
      email: data.user_email,
      linkedin,
      websiteOrGithub,
      lumaId: data.id,
      profileSummary,
      hasTeam,
    });

    if (participant) {
      console.log("Created new participant:", {
        id: participant.id,
        email: participant.email,
        name: participant.name,
      });
    } else {
      console.log("Participant already exists:", data.user_email);
    }

    return NextResponse.json({
      success: true,
      message: participant ? "Participant created" : "Participant already exists",
      participantId: participant?.id,
    });
  } catch (error) {
    console.error("Error processing Luma webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
