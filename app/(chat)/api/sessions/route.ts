import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getSessionsByUserId } from "@/lib/db/queries";

// GET /api/sessions - List all sessions for current user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await getSessionsByUserId(session.user.id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to get sessions:", error);
    return NextResponse.json(
      { error: "Failed to get sessions" },
      { status: 500 }
    );
  }
}
