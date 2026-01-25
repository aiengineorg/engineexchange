import { NextResponse } from "next/server";
import { z } from "zod";
import { getAllJudges, createJudge, getJudgeByName, updateJudgeGroup, getJudgeById } from "@/lib/db/queries";

const CreateJudgeSchema = z.object({
  name: z.string().min(1).max(100),
});

const UpdateJudgeSchema = z.object({
  judgeId: z.string().uuid(),
  judgingGroup: z.string().min(1).max(50),
});

// GET /api/judges - Get all judges
export async function GET() {
  try {
    const judges = await getAllJudges();
    return NextResponse.json({ judges });
  } catch (error) {
    console.error("Failed to get judges:", error);
    return NextResponse.json(
      { error: "Failed to fetch judges" },
      { status: 500 }
    );
  }
}

// POST /api/judges - Create a new judge
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = CreateJudgeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Check if judge already exists
    const existing = await getJudgeByName(name);
    if (existing) {
      return NextResponse.json(existing);
    }

    const judge = await createJudge(name);
    return NextResponse.json(judge);
  } catch (error) {
    console.error("Failed to create judge:", error);
    return NextResponse.json(
      { error: "Failed to create judge" },
      { status: 500 }
    );
  }
}

// PUT /api/judges - Update a judge's group
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = UpdateJudgeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { judgeId, judgingGroup } = validation.data;

    // Verify judge exists
    const existing = await getJudgeById(judgeId);
    if (!existing) {
      return NextResponse.json(
        { error: "Judge not found" },
        { status: 404 }
      );
    }

    const judge = await updateJudgeGroup(judgeId, judgingGroup);
    return NextResponse.json(judge);
  } catch (error) {
    console.error("Failed to update judge:", error);
    return NextResponse.json(
      { error: "Failed to update judge" },
      { status: 500 }
    );
  }
}
