import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createSubmission,
  getAllSubmissionsWithTeams,
  getTeamByUserId,
  getSubmissionByTeamId,
  hasValidContactEmail,
} from "@/lib/db/queries";

const CreateSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  githubLink: z.string().url(),
  description: z.string().min(10).max(2000),
  demoLink: z.string().url(),
  techStack: z.string().min(1).max(500),
  problemStatement: z.string().min(10).max(1000),
  fileUploads: z.array(z.string().url()).max(5).default([]),
  sponsorTech: z.array(z.enum(["Runware", "NVIDIA", "Anthropic", "Flux Models"])).default([]),
  // Hidden feedback fields (visible only to judges/admins)
  sponsorFeatureFeedback: z.string().max(1000).optional(),
  mediaPermission: z.string().optional().default("false"),
  eventFeedback: z.string().max(1000).optional(),
});

// Deadline: January 25, 2026 at 2:35 PM (local time)
const SUBMISSION_DEADLINE = new Date("2026-01-25T14:35:00");

// GET /api/submissions - Get all submissions
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

    // Check if user has valid contact email
    const hasEmail = await hasValidContactEmail(session.user.id, sessionId);
    if (!hasEmail) {
      return NextResponse.json(
        { error: "You must have a valid contact email to view submissions" },
        { status: 403 }
      );
    }

    // Check if user is in a team
    const team = await getTeamByUserId(session.user.id);
    if (!team) {
      return NextResponse.json(
        { error: "You must be part of a team to view submissions" },
        { status: 403 }
      );
    }

    const submissions = await getAllSubmissionsWithTeams(sessionId);

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Failed to get submissions:", error);
    return NextResponse.json(
      { error: "Failed to get submissions" },
      { status: 500 }
    );
  }
}

// POST /api/submissions - Create a submission
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = CreateSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      sessionId,
      projectName,
      githubLink,
      description,
      demoLink,
      techStack,
      problemStatement,
      fileUploads,
      sponsorTech,
      sponsorFeatureFeedback,
      mediaPermission,
      eventFeedback,
    } = validation.data;

    // Check if deadline has passed for new submissions
    if (new Date() > SUBMISSION_DEADLINE) {
      return NextResponse.json(
        { error: "Submission deadline has passed. New submissions are no longer accepted." },
        { status: 403 }
      );
    }

    // Check if user has valid contact email
    const hasEmail = await hasValidContactEmail(session.user.id, sessionId);
    if (!hasEmail) {
      return NextResponse.json(
        { error: "You must have a valid contact email to submit a project" },
        { status: 403 }
      );
    }

    // Check if user is in a team
    const team = await getTeamByUserId(session.user.id);
    if (!team) {
      return NextResponse.json(
        { error: "You must be part of a team to submit a project" },
        { status: 403 }
      );
    }

    // Check if team already has a submission
    const existingSubmission = await getSubmissionByTeamId(team.id);
    if (existingSubmission) {
      return NextResponse.json(
        { error: "Your team already has a submission. Edit it instead." },
        { status: 409 }
      );
    }

    // Create submission
    const submission = await createSubmission({
      teamId: team.id,
      projectName,
      githubLink,
      description,
      demoLink,
      techStack,
      problemStatement,
      fileUploads,
      sponsorTech,
      sponsorFeatureFeedback,
      mediaPermission,
      eventFeedback,
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Failed to create submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
