import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getTeamById, deleteTeam } from "@/lib/db/queries";

// DELETE /api/teams/[id] - Delete a team (team lead only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get team
    const team = await getTeamById(id);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is team lead
    if (team.teamLeadId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team lead can delete the team" },
        { status: 403 }
      );
    }

    // Delete team (cascade will delete members and submission)
    await deleteTeam(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
