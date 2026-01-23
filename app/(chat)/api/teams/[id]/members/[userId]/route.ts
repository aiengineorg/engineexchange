import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getTeamById, removeTeamMember } from "@/lib/db/queries";

// DELETE /api/teams/[id]/members/[userId] - Remove a member from a team
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: teamId, userId } = await params;

    // Get team
    const team = await getTeamById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check authorization:
    // - Team lead can remove anyone except themselves
    // - Members can remove themselves (leave team)
    const isTeamLead = team.teamLeadId === session.user.id;
    const isSelf = userId === session.user.id;

    if (!isTeamLead && !isSelf) {
      return NextResponse.json(
        { error: "Only the team lead can remove other members" },
        { status: 403 }
      );
    }

    // Team lead cannot remove themselves
    if (isTeamLead && isSelf) {
      return NextResponse.json(
        { error: "Team lead cannot leave the team. Delete the team instead." },
        { status: 400 }
      );
    }

    // Remove member
    await removeTeamMember(teamId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
