import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getTeamByUserId,
  getSubmissionByTeamId,
  hasValidContactEmail,
} from "@/lib/db/queries";

// GET /api/submissions/my-team - Get current team's submission
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Check if user has valid contact email
    const hasEmail = await hasValidContactEmail(session.user.id, sessionId);
    if (!hasEmail) {
      return NextResponse.json(
        { error: "You must have a valid contact email to access submissions" },
        { status: 403 }
      );
    }

    // Check if user is in a team
    const team = await getTeamByUserId(session.user.id, sessionId);
    if (!team) {
      return NextResponse.json(
        { error: "You must be part of a team to access submissions" },
        { status: 403 }
      );
    }

    // Get team's submission
    const submission = await getSubmissionByTeamId(team.id);

    return NextResponse.json({
      submission: submission || null,
      team,
    });
  } catch (error) {
    console.error("Failed to get my team's submission:", error);
    return NextResponse.json(
      { error: "Failed to get submission" },
      { status: 500 }
    );
  }
}
