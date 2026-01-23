import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createTeam,
  getTeamByNumber,
  getTeamsBySessionId,
  hasValidContactEmail,
  isUserInTeam,
} from "@/lib/db/queries";

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  teamNumber: z.string().min(1).max(20),
  sessionId: z.string().uuid(),
});

// GET /api/teams - Get all teams in a session
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

    const allTeams = await getTeamsBySessionId(sessionId);

    return NextResponse.json({ teams: allTeams });
  } catch (error) {
    console.error("Failed to get teams:", error);
    return NextResponse.json(
      { error: "Failed to get teams" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = CreateTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, teamNumber, sessionId } = validation.data;

    // Check if user has valid contact email
    const hasEmail = await hasValidContactEmail(session.user.id, sessionId);
    if (!hasEmail) {
      return NextResponse.json(
        { error: "Please add a contact email to your profile to create a team" },
        { status: 403 }
      );
    }

    // Check if user is already in a team
    const alreadyInTeam = await isUserInTeam(session.user.id);
    if (alreadyInTeam) {
      return NextResponse.json(
        { error: "You are already in a team" },
        { status: 409 }
      );
    }

    // Check if team number already exists in this session
    const existingTeam = await getTeamByNumber(teamNumber, sessionId);
    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this number already exists" },
        { status: 409 }
      );
    }

    // Create team (user will be added as member automatically)
    const team = await createTeam({
      name,
      teamNumber,
      teamLeadId: session.user.id,
      sessionId,
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
