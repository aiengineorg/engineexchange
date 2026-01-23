import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { searchUsersByEmailWithContactEmail } from "@/lib/db/queries";

// GET /api/users/search - Search users by email who have valid contact email
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const sessionId = searchParams.get("sessionId");

    if (!email) {
      return NextResponse.json(
        { error: "email query parameter is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Search for users with valid contact email
    const users = await searchUsersByEmailWithContactEmail(email, sessionId);

    // Filter out the current user from search results
    const filteredUsers = users.filter((u) => u.userId !== session.user.id);

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error("Failed to search users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
