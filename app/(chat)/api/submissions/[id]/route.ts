import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getSubmissionById,
  updateSubmission,
  getTeamByUserId,
  getTeamById,
} from "@/lib/db/queries";
import { SPONSOR_TECH_OPTIONS } from "@/lib/sponsor-tech";

const optionalDemoLinkSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => value === null || z.string().url().safeParse(value).success, {
    message: "Invalid URL",
  });

const UpdateSubmissionSchema = z.object({
  projectName: z.string().min(1).max(100).optional(),
  githubLink: z.string().url().optional(),
  description: z.string().min(10).max(2000).optional(),
  demoLink: optionalDemoLinkSchema.optional(),
  techStack: z.string().min(1).max(500).optional(),
  problemStatement: z.string().min(10).max(1000).optional(),
  sponsorTech: z.array(z.enum(SPONSOR_TECH_OPTIONS)).optional(),
  // Hidden feedback fields (visible only to judges/admins)
  sponsorFeatureFeedback: z.string().max(1000).optional(),
  mediaPermission: z.string().optional(),
  eventFeedback: z.string().max(1000).optional(),
});

// PUT /api/submissions/[id] - Update a submission
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = UpdateSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Get submission
    const submission = await getSubmissionById(id);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Get the team that owns this submission to determine session scope
    const submissionTeam = await getTeamById(submission.teamId);
    const team = await getTeamByUserId(session.user.id, submissionTeam?.sessionId);
    if (!team || team.id !== submission.teamId) {
      return NextResponse.json(
        { error: "You can only edit your team's submission" },
        { status: 403 }
      );
    }

    // Update submission
    const updatedSubmission = await updateSubmission(id, validation.data);

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("Failed to update submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
