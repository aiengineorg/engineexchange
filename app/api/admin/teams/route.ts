import { NextResponse } from "next/server";
import { getTeamsBySessionId, getTeamMembers } from "@/lib/db/queries";
import { DEFAULT_SESSION_ID } from "@/lib/constants";

export async function GET() {
  try {
    // Get all teams for the hackathon session
    const allTeams = await getTeamsBySessionId(DEFAULT_SESSION_ID);

    // For each team, get the full member details
    const teamsWithMembers = await Promise.all(
      allTeams.map(async (team) => {
        const members = await getTeamMembers(team.id, DEFAULT_SESSION_ID);

        // Format members for the response
        const formattedMembers = members.map((member) => ({
          id: member.id,
          userId: member.userId,
          displayName: member.profile?.displayName || "Unknown",
          contactEmail: member.profile?.contactEmail || null,
          images: member.profile?.images || null,
          isLead: member.isLead,
          addedAt: member.addedAt.toISOString(),
        }));

        return {
          id: team.id,
          name: team.name,
          teamNumber: team.teamNumber,
          teamLeadId: team.teamLeadId,
          sessionId: team.sessionId,
          createdAt: team.createdAt.toISOString(),
          memberCount: team.memberCount,
          members: formattedMembers,
        };
      })
    );

    return NextResponse.json({ teams: teamsWithMembers });
  } catch (error) {
    console.error("Failed to get admin teams:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch teams", details: errorMessage },
      { status: 500 }
    );
  }
}
