import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createMatch,
  createSwipe,
  getExistingMatch,
  getProfileById,
  getProfileByUserAndSession,
  getSwipe,
} from "@/lib/db/queries";
import { getRedisClient } from "@/lib/redis";

const SwipeSchema = z.object({
  targetUserId: z.string().uuid(),
  sessionId: z.string().uuid(),
  decision: z.enum(["yes", "no"]),
});

// POST /api/swipe - Swipe on a profile with atomic match detection
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = SwipeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { targetUserId, sessionId, decision } = validation.data;

    // Get my profile
    const myProfile = await getProfileByUserAndSession({
      userId: session.user.id,
      sessionId,
    });

    if (!myProfile) {
      return NextResponse.json(
        { error: "Profile not found. Create a profile first." },
        { status: 404 }
      );
    }

    // Verify target profile exists
    const targetProfile = await getProfileById(targetUserId);

    if (!targetProfile || targetProfile.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Target profile not found" },
        { status: 404 }
      );
    }

    // Check if swipe already exists
    const existingSwipe = await getSwipe({
      swipingUserId: myProfile.id,
      targetUserId,
    });

    if (existingSwipe) {
      return NextResponse.json(
        { error: "Already swiped on this profile" },
        { status: 409 }
      );
    }

    // Atomic match detection using Redis
    const redis = await getRedisClient();

    // Create deterministic key (sorted profile IDs)
    const [user1, user2] = [myProfile.id, targetUserId].sort();
    const redisKey = `swipes:${sessionId}:${user1}:${user2}`;

    // Lua script for atomic read-modify-write
    const luaScript = `
      redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
      redis.call('EXPIRE', KEYS[1], 86400)
      return redis.call('HGET', KEYS[1], ARGV[3])
    `;

    // Execute atomic operation
    const theirDecision = await redis.eval(luaScript, {
      keys: [redisKey],
      arguments: [`${myProfile.id}_swipe`, decision, `${targetUserId}_swipe`],
    });

    let matchId: string | null = null;

    // Check for match (both swiped YES)
    if (decision === "yes" && theirDecision === "yes") {
      // Check if match already exists
      const existingMatch = await getExistingMatch({
        profileId1: myProfile.id,
        profileId2: targetUserId,
      });

      if (existingMatch) {
        matchId = existingMatch.id;
      } else {
        // Create new match
        const newMatch = await createMatch({
          user1Id: myProfile.id,
          user2Id: targetUserId,
          sessionId,
        });
        matchId = newMatch.id;
      }
    }

    // Persist swipe to Postgres (durability)
    await createSwipe({
      swipingUserId: myProfile.id,
      targetUserId,
      sessionId,
      decision,
    });

    return NextResponse.json({
      matched: !!matchId,
      matchId,
      decision,
    });
  } catch (error) {
    console.error("Failed to process swipe:", error);
    return NextResponse.json(
      { error: "Failed to process swipe" },
      { status: 500 }
    );
  }
}
