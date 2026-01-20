import "server-only";

import { and, desc, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { nanoid } from "nanoid";
import {
  type Match,
  type MatchingSession,
  type Profile,
  type Swipe,
  type User,
  type HackathonParticipant,
  matches,
  matchingSessions,
  profiles,
  swipes,
  user,
  hackathonParticipants,
} from "./schema";
import { generateHashedPassword } from "./utils";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Export db instance for use in other modules
export { db };

// ==========================================
// USER QUERIES
// ==========================================

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user by email:", error);
    // Return empty array instead of throwing to allow sign-in to proceed
    // This handles cases where the database might have temporary issues
    return [];
  }
}

export async function createUser(email: string, password: string, discordId?: string | null) {
  // For OAuth users, password can be empty
  const hashedPassword = password ? generateHashedPassword(password) : null;

  try {
    return await db.insert(user).values({
      email,
      password: hashedPassword,
      discordId: discordId || null,
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user");
  }
}

export async function updateUserDiscordId(userId: string, discordId: string) {
  try {
    return await db
      .update(user)
      .set({ discordId })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("Failed to update user Discord ID:", error);
    throw new Error("Failed to update user Discord ID");
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const [foundUser] = await db.select().from(user).where(eq(user.id, userId));
    return foundUser || null;
  } catch (error) {
    console.error("Failed to get user by ID:", error);
    return null;
  }
}

export async function getUserByDiscordId(discordId: string): Promise<User | null> {
  try {
    const [foundUser] = await db.select().from(user).where(eq(user.discordId, discordId));
    return foundUser || null;
  } catch (error) {
    console.error("Failed to get user by Discord ID:", error);
    return null;
  }
}

// ==========================================
// SESSION QUERIES
// ==========================================

/**
 * Generate a unique 6-character session code (e.g., "ABC123")
 */
function generateSessionCode(): string {
  return nanoid(6).toUpperCase();
}

export async function createSession({
  name,
  createdBy,
}: {
  name: string;
  createdBy: string;
}): Promise<MatchingSession> {
  try {
    // Generate unique code
    let code = generateSessionCode();
    let attempts = 0;

    // Ensure code is unique (max 10 attempts)
    while (attempts < 10) {
      const existing = await db
        .select()
        .from(matchingSessions)
        .where(eq(matchingSessions.code, code))
        .limit(1);

      if (existing.length === 0) break;

      code = generateSessionCode();
      attempts++;
    }

    const [session] = await db
      .insert(matchingSessions)
      .values({
        name,
        code,
        createdBy,
      })
      .returning();

    return session;
  } catch (error) {
    console.error("Failed to create session:", error);
    throw new Error("Failed to create session");
  }
}

export async function getSessionByCode(code: string): Promise<MatchingSession | null> {
  try {
    const [session] = await db
      .select()
      .from(matchingSessions)
      .where(eq(matchingSessions.code, code.toUpperCase()))
      .limit(1);

    return session || null;
  } catch (error) {
    console.error("Failed to get session by code:", error);
    throw new Error("Failed to get session by code");
  }
}

export async function getSessionById(id: string): Promise<MatchingSession | null> {
  try {
    const [session] = await db
      .select()
      .from(matchingSessions)
      .where(eq(matchingSessions.id, id))
      .limit(1);

    return session || null;
  } catch (error) {
    console.error("Failed to get session by id:", error);
    throw new Error("Failed to get session by id");
  }
}

export async function getSessionsByUserId(userId: string): Promise<Array<MatchingSession & { profileCount: number }>> {
  try {
    // Get all sessions where user has a profile
    const userProfiles = await db
      .select({ sessionId: profiles.sessionId })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    if (userProfiles.length === 0) return [];

    const sessionIds = userProfiles.map((p) => p.sessionId);

    // Get sessions
    const sessions = await db
      .select()
      .from(matchingSessions)
      .where(inArray(matchingSessions.id, sessionIds))
      .orderBy(desc(matchingSessions.createdAt));

    // Get profile counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(profiles)
          .where(eq(profiles.sessionId, session.id));

        return {
          ...session,
          profileCount: countResult[0]?.count || 0,
        };
      })
    );

    return sessionsWithCounts;
  } catch (error) {
    console.error("Failed to get sessions by user id:", error);
    throw new Error("Failed to get sessions by user id");
  }
}

export async function getAvailableSessions(userId: string): Promise<Array<MatchingSession & { profileCount: number }>> {
  try {
    // Get all session IDs where user has a profile
    const userProfiles = await db
      .select({ sessionId: profiles.sessionId })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const userSessionIds = userProfiles.map((p) => p.sessionId);

    // Get all sessions where user doesn't have a profile
    let sessions: MatchingSession[];
    if (userSessionIds.length === 0) {
      // User has no sessions, return all sessions
      sessions = await db
        .select()
        .from(matchingSessions)
        .orderBy(desc(matchingSessions.createdAt));
    } else {
      sessions = await db
        .select()
        .from(matchingSessions)
        .where(notInArray(matchingSessions.id, userSessionIds))
        .orderBy(desc(matchingSessions.createdAt));
    }

    // Get profile counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(profiles)
          .where(eq(profiles.sessionId, session.id));

        return {
          ...session,
          profileCount: countResult[0]?.count || 0,
        };
      })
    );

    return sessionsWithCounts;
  } catch (error) {
    console.error("Failed to get available sessions:", error);
    throw new Error("Failed to get available sessions");
  }
}

// ==========================================
// PROFILE QUERIES
// ==========================================

export async function getProfileByUserAndSession({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<Profile | null> {
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.userId, userId), eq(profiles.sessionId, sessionId)))
      .limit(1);

    if (profile) {
      console.log("📖 Retrieved profile:", {
        id: profile.id,
        displayName: profile.displayName,
        hasOfferEmbedding: !!profile.whatIOfferEmbedding,
        hasLookingForEmbedding: !!profile.whatImLookingForEmbedding,
        offerEmbeddingType: typeof profile.whatIOfferEmbedding,
        lookingForEmbeddingType: typeof profile.whatImLookingForEmbedding,
      });
    }

    return profile || null;
  } catch (error) {
    console.error("Failed to get profile:", error);
    throw new Error("Failed to get profile");
  }
}

export async function getProfileById(id: string): Promise<Profile | null> {
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    return profile || null;
  } catch (error) {
    console.error("Failed to get profile by id:", error);
    throw new Error("Failed to get profile by id");
  }
}

export async function createProfile(data: {
  userId: string;
  sessionId: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatIOfferEmbedding: number[];
  whatImLookingFor: string;
  whatImLookingForEmbedding: number[];
  linkedinUrl?: string;
  linkedinEnrichmentSummary?: string;
  websiteOrGithub?: string;
  hasTeam?: boolean;
}): Promise<Profile> {
  try {
    console.log("📝 Inserting profile into database with:", {
      displayName: data.displayName,
      whatIOffer: data.whatIOffer.substring(0, 50) + "...",
      whatIOfferEmbeddingLength: data.whatIOfferEmbedding.length,
      whatImLookingFor: data.whatImLookingFor.substring(0, 50) + "...",
      whatImLookingForEmbeddingLength: data.whatImLookingForEmbedding.length,
    });
    
    const [profile] = await db.insert(profiles).values(data).returning();
    
    console.log("✅ Profile inserted successfully:", {
      id: profile.id,
      hasOfferEmbedding: !!profile.whatIOfferEmbedding,
      hasLookingForEmbedding: !!profile.whatImLookingForEmbedding,
      offerEmbeddingType: typeof profile.whatIOfferEmbedding,
      lookingForEmbeddingType: typeof profile.whatImLookingForEmbedding,
    });
    
    return profile;
  } catch (error) {
    console.error("Failed to create profile:", error);
    throw new Error("Failed to create profile");
  }
}

export async function updateProfile({
  id,
  displayName,
  images,
  whatIOffer,
  whatIOfferEmbedding,
  whatImLookingFor,
  whatImLookingForEmbedding,
  linkedinUrl,
  linkedinEnrichmentSummary,
  websiteOrGithub,
  hasTeam,
}: {
  id: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatIOfferEmbedding: number[];
  whatImLookingFor: string;
  whatImLookingForEmbedding: number[];
  linkedinUrl?: string;
  linkedinEnrichmentSummary?: string;
  websiteOrGithub?: string;
  hasTeam?: boolean;
}): Promise<Profile> {
  try {
    const updateData: {
      displayName: string;
      images: string[];
      whatIOffer: string;
      whatIOfferEmbedding: number[];
      whatImLookingFor: string;
      whatImLookingForEmbedding: number[];
      updatedAt: Date;
      linkedinUrl?: string;
      linkedinEnrichmentSummary?: string;
      websiteOrGithub?: string;
      hasTeam?: boolean;
    } = {
      displayName,
      images,
      whatIOffer,
      whatIOfferEmbedding,
      whatImLookingFor,
      whatImLookingForEmbedding,
      updatedAt: new Date(),
    };

    if (linkedinUrl !== undefined) {
      updateData.linkedinUrl = linkedinUrl;
    }
    if (linkedinEnrichmentSummary !== undefined) {
      updateData.linkedinEnrichmentSummary = linkedinEnrichmentSummary;
    }
    if (websiteOrGithub !== undefined) {
      updateData.websiteOrGithub = websiteOrGithub;
    }
    if (hasTeam !== undefined) {
      updateData.hasTeam = hasTeam;
    }

    const [profile] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, id))
      .returning();

    return profile;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw new Error("Failed to update profile");
  }
}

/**
 * Update a profile's LinkedIn enrichment data by LinkedIn URL
 * Used when Clay webhook sends enriched data back
 */
export async function updateProfileByLinkedInUrl(
  linkedinUrl: string,
  data: {
    linkedinEnrichmentSummary?: string;
    whatIOffer?: string;
    whatIOfferEmbedding?: number[];
  }
): Promise<Profile | null> {
  try {
    const updateData: {
      linkedinEnrichmentSummary?: string;
      whatIOffer?: string;
      whatIOfferEmbedding?: number[];
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.linkedinEnrichmentSummary !== undefined) {
      updateData.linkedinEnrichmentSummary = data.linkedinEnrichmentSummary;
    }
    if (data.whatIOffer !== undefined) {
      updateData.whatIOffer = data.whatIOffer;
    }
    if (data.whatIOfferEmbedding !== undefined) {
      updateData.whatIOfferEmbedding = data.whatIOfferEmbedding;
    }

    const [profile] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.linkedinUrl, linkedinUrl))
      .returning();

    return profile || null;
  } catch (error) {
    console.error("Failed to update profile by LinkedIn URL:", error);
    return null;
  }
}

// ==========================================
// SWIPE QUERIES
// ==========================================

export async function getSwipesByProfile(profileId: string): Promise<Swipe[]> {
  try {
    return await db
      .select()
      .from(swipes)
      .where(eq(swipes.swipingUserId, profileId))
      .orderBy(desc(swipes.createdAt));
  } catch (error) {
    console.error("Failed to get swipes by profile:", error);
    throw new Error("Failed to get swipes by profile");
  }
}

export async function getSwipe({
  swipingUserId,
  targetUserId,
}: {
  swipingUserId: string;
  targetUserId: string;
}): Promise<Swipe | null> {
  try {
    const [swipe] = await db
      .select()
      .from(swipes)
      .where(
        and(
          eq(swipes.swipingUserId, swipingUserId),
          eq(swipes.targetUserId, targetUserId)
        )
      )
      .limit(1);

    return swipe || null;
  } catch (error) {
    console.error("Failed to get swipe:", error);
    throw new Error("Failed to get swipe");
  }
}

export async function createSwipe(data: {
  swipingUserId: string;
  targetUserId: string;
  sessionId: string;
  decision: "yes" | "no";
}): Promise<Swipe> {
  try {
    const [swipe] = await db.insert(swipes).values(data).returning();
    return swipe;
  } catch (error) {
    console.error("Failed to create swipe:", error);
    throw new Error("Failed to create swipe");
  }
}

// ==========================================
// MATCH QUERIES
// ==========================================

export async function getMatchesByProfile(profileId: string): Promise<
  Array<{
    match: Match;
    otherProfile: Profile;
    otherUserDiscordId: string | null;
  }>
> {
  try {
    // Get all matches where user is either user1 or user2
    const userMatches = await db
      .select()
      .from(matches)
      .where(or(eq(matches.user1Id, profileId), eq(matches.user2Id, profileId)))
      .orderBy(desc(matches.createdAt));

    // For each match, get the other profile and user's Discord ID
    const results = await Promise.all(
      userMatches.map(async (match) => {
        const otherProfileId =
          match.user1Id === profileId ? match.user2Id : match.user1Id;

        const [otherProfile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, otherProfileId))
          .limit(1);

        // Get the Discord ID of the other user
        const [otherUser] = await db
          .select({ discordId: user.discordId })
          .from(user)
          .where(eq(user.id, otherProfile.userId))
          .limit(1);

        return {
          match,
          otherProfile,
          otherUserDiscordId: otherUser?.discordId || null,
        };
      })
    );

    return results;
  } catch (error) {
    console.error("Failed to get matches by profile:", error);
    throw new Error("Failed to get matches by profile");
  }
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  try {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    return match || null;
  } catch (error) {
    console.error("Failed to get match by id:", error);
    throw new Error("Failed to get match by id");
  }
}

export async function getExistingMatch({
  profileId1,
  profileId2,
}: {
  profileId1: string;
  profileId2: string;
}): Promise<Match | null> {
  try {
    const [user1, user2] = [profileId1, profileId2].sort();

    const [match] = await db
      .select()
      .from(matches)
      .where(and(eq(matches.user1Id, user1), eq(matches.user2Id, user2)))
      .limit(1);

    return match || null;
  } catch (error) {
    console.error("Failed to get existing match:", error);
    throw new Error("Failed to get existing match");
  }
}

export async function createMatch(data: {
  user1Id: string;
  user2Id: string;
  sessionId: string;
}): Promise<Match> {
  try {
    // Ensure user1Id < user2Id for consistency
    const [sortedUser1, sortedUser2] = [data.user1Id, data.user2Id].sort();

    const [match] = await db
      .insert(matches)
      .values({
        user1Id: sortedUser1,
        user2Id: sortedUser2,
        sessionId: data.sessionId,
      })
      .returning();

    return match;
  } catch (error) {
    // Handle unique constraint violation (race condition)
    // Postgres error code 23505 = unique_violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      // Match already exists, fetch and return it
      const existingMatch = await getExistingMatch({
        profileId1: data.user1Id,
        profileId2: data.user2Id,
      });

      if (existingMatch) {
        return existingMatch;
      }

      // If we can't find it, something else went wrong
      console.error("Failed to create match - duplicate but not found:", error);
      throw new Error("Failed to create match");
    }

    // Other errors
    console.error("Failed to create match:", error);
    throw new Error("Failed to create match");
  }
}

// ==========================================
// HACKATHON PARTICIPANT QUERIES
// ==========================================

/**
 * Get hackathon participant by email (case-insensitive)
 */
export async function getHackathonParticipantByEmail(
  email: string
): Promise<HackathonParticipant | null> {
  try {
    const [participant] = await db
      .select()
      .from(hackathonParticipants)
      .where(eq(hackathonParticipants.email, email.toLowerCase()))
      .limit(1);

    return participant || null;
  } catch (error) {
    console.error("Failed to get hackathon participant by email:", error);
    return null;
  }
}

/**
 * Save email verification token for a user
 */
export async function saveEmailVerificationToken(
  userId: string,
  lumaEmail: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  try {
    await db
      .update(user)
      .set({
        emailToVerify: lumaEmail.toLowerCase(),
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
      })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("Failed to save email verification token:", error);
    throw new Error("Failed to save email verification token");
  }
}

/**
 * Verify email token and return the participant if valid
 */
export async function verifyEmailToken(
  userId: string,
  token: string
): Promise<{ success: boolean; participant?: HackathonParticipant; error?: string }> {
  try {
    // Get user with verification data
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!foundUser) {
      return { success: false, error: "User not found" };
    }

    if (!foundUser.emailVerificationToken || !foundUser.emailToVerify) {
      return { success: false, error: "No verification pending" };
    }

    if (foundUser.emailVerificationToken !== token) {
      return { success: false, error: "Invalid token" };
    }

    if (foundUser.emailVerificationExpiresAt && foundUser.emailVerificationExpiresAt < new Date()) {
      return { success: false, error: "Token expired" };
    }

    // Token is valid, get the participant
    const participant = await getHackathonParticipantByEmail(foundUser.emailToVerify);

    if (!participant) {
      return { success: false, error: "Participant not found" };
    }

    return { success: true, participant };
  } catch (error) {
    console.error("Failed to verify email token:", error);
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Link verified participant to user and clear verification token
 */
export async function linkParticipantToUser(
  userId: string,
  participantId: string
): Promise<void> {
  try {
    await db
      .update(user)
      .set({
        verifiedParticipantId: participantId,
        emailVerificationToken: null,
        emailToVerify: null,
        emailVerificationExpiresAt: null,
      })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("Failed to link participant to user:", error);
    throw new Error("Failed to link participant to user");
  }
}

/**
 * Get user's verified participant data
 */
export async function getUserVerifiedParticipant(
  userId: string
): Promise<HackathonParticipant | null> {
  try {
    const [foundUser] = await db
      .select({ verifiedParticipantId: user.verifiedParticipantId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!foundUser?.verifiedParticipantId) {
      return null;
    }

    const [participant] = await db
      .select()
      .from(hackathonParticipants)
      .where(eq(hackathonParticipants.id, foundUser.verifiedParticipantId))
      .limit(1);

    return participant || null;
  } catch (error) {
    console.error("Failed to get user verified participant:", error);
    return null;
  }
}

