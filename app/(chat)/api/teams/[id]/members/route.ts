import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getTeamById,
  addTeamMember,
  hasValidContactEmail,
  isUserInTeam,
} from "@/lib/db/queries";

const AddMemberSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

// POST /api/teams/[id]/members - Add a member to a team (team lead only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: teamId } = await params;
    const body = await request.json();
    const validation = AddMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, sessionId } = validation.data;

    // Get team
    const team = await getTeamById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is team lead
    if (team.teamLeadId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the team lead can add members" },
        { status: 403 }
      );
    }

    // Check if target user has valid contact email
    const hasEmail = await hasValidContactEmail(userId, sessionId);
    if (!hasEmail) {
      return NextResponse.json(
        { error: "This user doesn't have a contact email set and cannot be added to a team" },
        { status: 400 }
      );
    }

    // Check if target user is already in a team
    const alreadyInTeam = await isUserInTeam(userId);
    if (alreadyInTeam) {
      return NextResponse.json(
        { error: "This user is already in a team" },
        { status: 409 }
      );
    }

    // Add member
    const member = await addTeamMember(teamId, userId);

    return NextResponse.json(member);
  } catch (error) {
    console.error("Failed to add team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}
