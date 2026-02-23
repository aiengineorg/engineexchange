import { NextResponse } from "next/server";
import {
  getAllJudgingScores,
  getAllSubmissionsWithTeams,
  getScoresBySubmission,
  getAllJudges,
} from "@/lib/db/queries";
import { DEFAULT_SESSION_ID } from "@/lib/constants";

// GET /api/admin/judging - Get all judging data for admin
export async function GET() {
  try {
    // Get all submissions with teams
    const submissionsWithTeams = await getAllSubmissionsWithTeams(DEFAULT_SESSION_ID);

    // Get all judges
    const judges = await getAllJudges();

    // For each submission, get all scores and calculate totals
    const submissionsWithScores = await Promise.all(
      submissionsWithTeams.map(async ({ submission, team, members }) => {
        const scores = await getScoresBySubmission(submission.id);

        // Calculate average scores
        let totalFuturePotential = 0;
        let totalDemo = 0;
        let totalCreativity = 0;
        let totalPitchingQuality = 0;
        let totalBonusFlux = 0;
        let totalScore = 0;

        scores.forEach((score) => {
          const fp = parseInt(score.futurePotential) || 0;
          const demo = parseInt(score.demo) || 0;
          const creativity = parseInt(score.creativity) || 0;
          const pitching = parseInt(score.pitchingQuality) || 0;
          const bonus = parseInt(score.bonusFlux || "0") || 0;

          totalFuturePotential += fp;
          totalDemo += demo;
          totalCreativity += creativity;
          totalPitchingQuality += pitching;
          totalBonusFlux += bonus;

          // Each category is 25%, so total base is out of 40 (4 categories * 10)
          // Normalize to percentage and add bonus
          const baseScore = fp + demo + creativity + pitching;
          totalScore += baseScore + bonus;
        });

        const numScores = scores.length || 1;

        // Count recommendations
        const nvidiaRecommendations = scores.filter(s => s.recommendNvidia === "true").length;
        const runwareRecommendations = scores.filter(s => s.recommendRunware === "true").length;

        return {
          submission: {
            id: submission.id,
            projectName: submission.projectName,
            githubLink: submission.githubLink,
            demoLink: submission.demoLink,
            techStack: submission.techStack,
            sponsorTech: submission.sponsorTech || [],
            // Hidden feedback fields
            sponsorFeatureFeedback: submission.sponsorFeatureFeedback,
            mediaPermission: submission.mediaPermission,
            eventFeedback: submission.eventFeedback,
          },
          team: {
            id: team.id,
            name: team.name,
            teamNumber: team.teamNumber,
          },
          members,
          scores: scores.map((s) => ({
            id: s.id,
            judgeName: s.judgeName,
            judgeGroup: s.judgeGroup,
            futurePotential: s.futurePotential,
            demo: s.demo,
            creativity: s.creativity,
            pitchingQuality: s.pitchingQuality,
            bonusFlux: s.bonusFlux,
            additionalComments: s.additionalComments,
            total:
              (parseInt(s.futurePotential) || 0) +
              (parseInt(s.demo) || 0) +
              (parseInt(s.creativity) || 0) +
              (parseInt(s.pitchingQuality) || 0) +
              (parseInt(s.bonusFlux || "0") || 0),
            recommendNvidia: s.recommendNvidia,
            recommendRunware: s.recommendRunware,
          })),
          averages: {
            futurePotential: (totalFuturePotential / numScores).toFixed(1),
            demo: (totalDemo / numScores).toFixed(1),
            creativity: (totalCreativity / numScores).toFixed(1),
            pitchingQuality: (totalPitchingQuality / numScores).toFixed(1),
            bonusFlux: (totalBonusFlux / numScores).toFixed(1),
            total: (totalScore / numScores).toFixed(1),
          },
          totalScore: totalScore,
          numJudges: scores.length,
          nvidiaRecommendations,
          runwareRecommendations,
        };
      })
    );

    // Sort by total score descending
    submissionsWithScores.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({
      submissions: submissionsWithScores,
      judges,
      totalSubmissions: submissionsWithScores.length,
      totalJudges: judges.length,
    });
  } catch (error) {
    console.error("Failed to get admin judging data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch judging data", details: errorMessage },
      { status: 500 }
    );
  }
}
