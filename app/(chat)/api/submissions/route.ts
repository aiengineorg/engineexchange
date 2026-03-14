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
import { SUBMISSIONS_OPEN, SUBMISSION_DEADLINE } from "@/lib/constants";

const optionalDemoLinkSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => value === null || z.string().url().safeParse(value).success, {
    message: "Invalid URL",
  });

const CreateSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  projectName: z.string().min(1).max(100),
  githubLink: z.string().url(),
  description: z.string().min(10).max(2000),
  demoLink: optionalDemoLinkSchema,
  techStack: z.string().min(1).max(500),
  problemStatement: z.string().min(10).max(1000),
  sponsorTech: z.array(z.enum(["Runware", "NVIDIA (Nemotron)", "Anthropic", "Anthropic Agent SDK", "Doubleword", "Prolific", "Lovable"])).default([]),
  // Hidden feedback fields (visible only to judges/admins)
  sponsorFeatureFeedback: z.string().max(1000).optional(),
  mediaPermission: z.string().optional().default("false"),
  eventFeedback: z.string().max(1000).optional(),
});

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
    const team = await getTeamByUserId(session.user.id, sessionId);
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
      sponsorTech,
      sponsorFeatureFeedback,
      mediaPermission,
      eventFeedback,
    } = validation.data;

    // Check if submissions are open
    if (!SUBMISSIONS_OPEN) {
      return NextResponse.json(
        { error: "Submissions are currently closed." },
        { status: 403 }
      );
    }

    // Check if deadline has passed for new submissions
    if (SUBMISSION_DEADLINE && new Date() > SUBMISSION_DEADLINE) {
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
    const team = await getTeamByUserId(session.user.id, sessionId);
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
