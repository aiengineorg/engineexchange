import { NextResponse } from "next/server";
import {
  getAllSubmissionsWithTeams,
  getScoreByJudgeAndSubmission,
} from "@/lib/db/queries";

// Default hackathon session ID
const DEFAULT_SESSION_ID = "1784d222-27f9-4fed-a28f-f454444e760f";

// GET /api/judges/submissions?judgeId=xxx - Get all submissions for judging
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId");

    const submissionsWithTeams = await getAllSubmissionsWithTeams(DEFAULT_SESSION_ID);

    // If judgeId provided, include whether this judge has scored each submission
    const submissionsWithStatus = await Promise.all(
      submissionsWithTeams.map(async ({ submission, team, members }) => {
        let hasScored = false;
        let existingScore = null;

        if (judgeId) {
          const score = await getScoreByJudgeAndSubmission(judgeId, submission.id);
          hasScored = !!score;
          existingScore = score;
        }

        return {
          submission: {
            id: submission.id,
            projectName: submission.projectName,
            githubLink: submission.githubLink,
            demoLink: submission.demoLink,
            description: submission.description,
            problemStatement: submission.problemStatement,
            techStack: submission.techStack,
            sponsorTech: submission.sponsorTech || [],
            fileUploads: submission.fileUploads || [],
          },
          team: {
            id: team.id,
            name: team.name,
            teamNumber: team.teamNumber,
          },
          members: members.map((m) => ({
            displayName: m.displayName,
            isLead: m.isLead,
          })),
          hasScored,
          existingScore,
        };
      })
    );

    return NextResponse.json({ submissions: submissionsWithStatus });
  } catch (error) {
    console.error("Failed to get submissions for judging:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
