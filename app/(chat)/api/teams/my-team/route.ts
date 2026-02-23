import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getTeamByUserId, getTeamWithMembers } from "@/lib/db/queries";

// GET /api/teams/my-team - Get current user's team with members
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

    // Get user's team
    const team = await getTeamByUserId(session.user.id, sessionId);

    if (!team) {
      return NextResponse.json({ team: null, members: [] });
    }

    // Get team with members
    const teamWithMembers = await getTeamWithMembers(team.id, sessionId);

    if (!teamWithMembers) {
      return NextResponse.json({ team: null, members: [] });
    }

    return NextResponse.json({
      team: teamWithMembers.team,
      members: teamWithMembers.members,
      isLead: teamWithMembers.team.teamLeadId === session.user.id,
    });
  } catch (error) {
    console.error("Failed to get my team:", error);
    return NextResponse.json(
      { error: "Failed to get team" },
      { status: 500 }
    );
  }
}
