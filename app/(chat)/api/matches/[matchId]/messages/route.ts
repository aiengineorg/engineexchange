import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createMessage,
  getMatchById,
  getMessagesByMatch,
  getProfileById,
} from "@/lib/db/queries";

const CreateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

// GET /api/matches/[matchId]/messages - Get messages for a match
export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { matchId } = await params;

    // Verify match exists
    const match = await getMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is part of this match
    const profile1 = await getProfileById(match.user1Id);
    const profile2 = await getProfileById(match.user2Id);

    if (
      !profile1 ||
      !profile2 ||
      (profile1.userId !== session.user.id && profile2.userId !== session.user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get messages
    const messages = await getMessagesByMatch(matchId);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to get messages:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// POST /api/matches/[matchId]/messages - Send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { matchId } = await params;

    // Verify match exists
    const match = await getMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is part of this match and get their profile ID
    const profile1 = await getProfileById(match.user1Id);
    const profile2 = await getProfileById(match.user2Id);

    if (!profile1 || !profile2) {
      return NextResponse.json({ error: "Match profiles not found" }, { status: 404 });
    }

    let senderProfileId: string | null = null;

    if (profile1.userId === session.user.id) {
      senderProfileId = profile1.id;
    } else if (profile2.userId === session.user.id) {
      senderProfileId = profile2.id;
    }

    if (!senderProfileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validation = CreateMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Create message
    const message = await createMessage({
      matchId,
      senderId: senderProfileId,
      content,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to create message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
