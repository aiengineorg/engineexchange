import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { hasValidContactEmail, getTeamByUserId } from "@/lib/db/queries";

// GET /api/profiles/check-email - Check if user has valid contact email and team status
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

    const hasEmail = await hasValidContactEmail(session.user.id, sessionId);
    const team = await getTeamByUserId(session.user.id, sessionId);

    return NextResponse.json({
      hasValidEmail: hasEmail,
      hasTeam: !!team,
      teamId: team?.id || null,
    });
  } catch (error) {
    console.error("Failed to check email:", error);
    return NextResponse.json(
      { error: "Failed to check email" },
      { status: 500 }
    );
  }
}
