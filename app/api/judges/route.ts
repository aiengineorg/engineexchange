import { NextResponse } from "next/server";
import { z } from "zod";
import { getAllJudges, createJudge, getJudgeByName } from "@/lib/db/queries";

const CreateJudgeSchema = z.object({
  name: z.string().min(1).max(100),
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
