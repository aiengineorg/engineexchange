import { NextResponse } from "next/server";
import { getAllSubmissionsWithTeams } from "@/lib/db/queries";

// Default hackathon session ID
const DEFAULT_SESSION_ID = "1784d222-27f9-4fed-a28f-f454444e760f";

export async function GET() {
  try {
    // Get all submissions with team and member details
    const submissionsWithTeams = await getAllSubmissionsWithTeams(DEFAULT_SESSION_ID);

    // Format the response
    const formattedSubmissions = submissionsWithTeams.map(({ submission, team, members }) => ({
      id: submission.id,
      projectName: submission.projectName,
      githubLink: submission.githubLink,
      demoLink: submission.demoLink || null,
      description: submission.description,
      problemStatement: submission.problemStatement,
      techStack: submission.techStack,
      sponsorTech: submission.sponsorTech || [],
      fileUploads: submission.fileUploads || [],
      submittedAt: submission.submittedAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      team: {
        id: team.id,
        name: team.name,
        teamNumber: team.teamNumber,
      },
      members: members.map((member) => ({
        userId: member.userId,
        displayName: member.displayName,
        contactEmail: member.contactEmail,
        isLead: member.isLead,
      })),
    }));

    return NextResponse.json({ submissions: formattedSubmissions });
  } catch (error) {
    console.error("Failed to get admin submissions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch submissions", details: errorMessage },
      { status: 500 }
    );
  }
}
