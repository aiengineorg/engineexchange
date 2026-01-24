import { NextResponse } from "next/server";
import { z } from "zod";
import {
  upsertJudgingScore,
  getScoresByJudge,
  getJudgeById,
  getSubmissionById,
  getTeamById,
} from "@/lib/db/queries";

const ScoreSchema = z.object({
  judgeId: z.string().uuid(),
  submissionId: z.string().uuid(),
  futurePotential: z.string().regex(/^([0-9]|10)$/, "Must be 0-10"),
  demo: z.string().regex(/^([0-9]|10)$/, "Must be 0-10"),
  creativity: z.string().regex(/^([0-9]|10)$/, "Must be 0-10"),
  pitchingQuality: z.string().regex(/^([0-9]|10)$/, "Must be 0-10"),
  bonusFlux: z.string().regex(/^([0-9]|10)$/, "Must be 0-10").optional(),
  additionalComments: z.string().max(2000).optional(),
});

// GET /api/judges/scores?judgeId=xxx - Get scores by judge
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId");

    if (!judgeId) {
      return NextResponse.json(
        { error: "judgeId is required" },
        { status: 400 }
      );
    }

    const scores = await getScoresByJudge(judgeId);

    // Enrich with submission and team details
    const enrichedScores = await Promise.all(
      scores.map(async (score) => {
        const submission = await getSubmissionById(score.submissionId);
        let team = null;
        if (submission) {
          team = await getTeamById(submission.teamId);
        }
        return {
          ...score,
          submission: submission
            ? {
                id: submission.id,
                projectName: submission.projectName,
              }
            : null,
          team: team
            ? {
                id: team.id,
                name: team.name,
                teamNumber: team.teamNumber,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ scores: enrichedScores });
  } catch (error) {
    console.error("Failed to get scores:", error);
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    );
  }
}

// POST /api/judges/scores - Submit or update a score
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ScoreSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { judgeId, submissionId, ...scoreData } = validation.data;

    // Verify judge exists
    const judge = await getJudgeById(judgeId);
    if (!judge) {
      return NextResponse.json(
        { error: "Judge not found" },
        { status: 404 }
      );
    }

    // Verify submission exists
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const score = await upsertJudgingScore({
      judgeId,
      submissionId,
      ...scoreData,
    });

    return NextResponse.json(score);
  } catch (error) {
    console.error("Failed to submit score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
