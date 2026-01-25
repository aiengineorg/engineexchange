import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getSubmissionById,
  updateSubmission,
  getTeamByUserId,
} from "@/lib/db/queries";

const UpdateSubmissionSchema = z.object({
  projectName: z.string().min(1).max(100).optional(),
  githubLink: z.string().url().optional(),
  description: z.string().min(10).max(2000).optional(),
  demoLink: z.string().url().optional(),
  techStack: z.string().min(1).max(500).optional(),
  problemStatement: z.string().min(10).max(1000).optional(),
  fileUploads: z.array(z.string().url()).max(5).optional(),
  sponsorTech: z.array(z.enum(["Runware", "NVIDIA", "Anthropic", "Flux Models"])).optional(),
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

    // Check if user is in the team that owns this submission
    const team = await getTeamByUserId(session.user.id);
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
