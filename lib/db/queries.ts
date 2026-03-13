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
  type Team,
  type TeamMember,
  type Submission,
  type Judge,
  type JudgingScore,
  matches,
  matchingSessions,
  profiles,
  swipes,
  user,
  hackathonParticipants,
  teams,
  teamMembers,
  submissions,
  judges,
  judgingScores,
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
  contactEmail?: string;
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
  contactEmail,
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
  contactEmail?: string;
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
      contactEmail?: string;
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
    if (contactEmail !== undefined) {
      updateData.contactEmail = contactEmail;
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
 * Create a new hackathon participant (used by Luma webhook)
 * Returns the created participant, or null if one already exists with that email
 */
export async function createHackathonParticipant(data: {
  name: string | null;
  email: string;
  linkedin?: string | null;
  websiteOrGithub?: string | null;
  lumaId: string;
  profileSummary?: string | null;
  hasTeam?: boolean;
}): Promise<HackathonParticipant | null> {
  try {
    const emailLower = data.email.toLowerCase();

    // Check if participant already exists
    const existing = await getHackathonParticipantByEmail(emailLower);
    if (existing) {
      console.log(`Participant already exists: ${emailLower}`);
      return null;
    }

    const [participant] = await db
      .insert(hackathonParticipants)
      .values({
        name: data.name,
        email: emailLower,
        linkedin: data.linkedin || null,
        websiteOrGithub: data.websiteOrGithub || null,
        lumaId: data.lumaId,
        profileSummary: data.profileSummary || null,
        hasTeam: data.hasTeam ?? false,
      })
      .returning();

    return participant;
  } catch (error) {
    console.error("Failed to create hackathon participant:", error);
    throw error;
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

// ==========================================
// TEAM QUERIES
// ==========================================

/**
 * Check if user has a valid contact email in their profile for a session
 */
export async function hasValidContactEmail(
  userId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const [profile] = await db
      .select({ contactEmail: profiles.contactEmail })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), eq(profiles.sessionId, sessionId)))
      .limit(1);

    return !!(profile?.contactEmail && profile.contactEmail.includes("@"));
  } catch (error) {
    console.error("Failed to check contact email:", error);
    return false;
  }
}

/**
 * Get profile contact email for a user in a session
 */
export async function getProfileContactEmail(
  userId: string,
  sessionId: string
): Promise<string | null> {
  try {
    const [profile] = await db
      .select({ contactEmail: profiles.contactEmail })
      .from(profiles)
      .where(and(eq(profiles.userId, userId), eq(profiles.sessionId, sessionId)))
      .limit(1);

    return profile?.contactEmail || null;
  } catch (error) {
    console.error("Failed to get contact email:", error);
    return null;
  }
}

/**
 * Create a new team
 */
export async function createTeam(data: {
  name: string;
  teamNumber: string;
  teamLeadId: string;
  sessionId: string;
}): Promise<Team> {
  try {
    const [team] = await db.insert(teams).values(data).returning();

    // Also add team lead as a team member
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: data.teamLeadId,
    });

    return team;
  } catch (error) {
    console.error("Failed to create team:", error);
    throw error;
  }
}

/**
 * Get team by ID
 */
export async function getTeamById(id: string): Promise<Team | null> {
  try {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);

    return team || null;
  } catch (error) {
    console.error("Failed to get team by id:", error);
    return null;
  }
}

/**
 * Get team by team number within a session
 */
export async function getTeamByNumber(
  teamNumber: string,
  sessionId: string
): Promise<Team | null> {
  try {
    const [team] = await db
      .select()
      .from(teams)
      .where(
        and(eq(teams.teamNumber, teamNumber), eq(teams.sessionId, sessionId))
      )
      .limit(1);

    return team || null;
  } catch (error) {
    console.error("Failed to get team by number:", error);
    return null;
  }
}

/**
 * Get team that a user belongs to (optionally scoped to a session)
 */
export async function getTeamByUserId(userId: string, sessionId?: string): Promise<Team | null> {
  try {
    const query = db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers);

    let result;
    if (sessionId) {
      [result] = await query
        .innerJoin(teams, eq(teams.id, teamMembers.teamId))
        .where(and(eq(teamMembers.userId, userId), eq(teams.sessionId, sessionId)))
        .limit(1);
    } else {
      [result] = await query
        .where(eq(teamMembers.userId, userId))
        .limit(1);
    }

    if (!result) {
      return null;
    }

    return getTeamById(result.teamId);
  } catch (error) {
    console.error("Failed to get team by user id:", error);
    return null;
  }
}

/**
 * Get all members of a team with their profile info
 */
export async function getTeamMembers(
  teamId: string,
  sessionId: string
): Promise<
  Array<{
    id: string;
    userId: string;
    addedAt: Date;
    profile: Profile | null;
    isLead: boolean;
  }>
> {
  try {
    // Get team to know who the lead is
    const team = await getTeamById(teamId);
    if (!team) {
      return [];
    }

    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    // Get profiles for each member
    const membersWithProfiles = await Promise.all(
      members.map(async (member) => {
        const [profile] = await db
          .select()
          .from(profiles)
          .where(
            and(
              eq(profiles.userId, member.userId),
              eq(profiles.sessionId, sessionId)
            )
          )
          .limit(1);

        return {
          id: member.id,
          userId: member.userId,
          addedAt: member.addedAt,
          profile: profile || null,
          isLead: member.userId === team.teamLeadId,
        };
      })
    );

    return membersWithProfiles;
  } catch (error) {
    console.error("Failed to get team members:", error);
    return [];
  }
}

/**
 * Get team with all its members
 */
export async function getTeamWithMembers(
  teamId: string,
  sessionId: string
): Promise<{
  team: Team;
  members: Array<{
    id: string;
    userId: string;
    addedAt: Date;
    profile: Profile | null;
    isLead: boolean;
  }>;
} | null> {
  try {
    const team = await getTeamById(teamId);
    if (!team) {
      return null;
    }

    const members = await getTeamMembers(teamId, sessionId);

    return { team, members };
  } catch (error) {
    console.error("Failed to get team with members:", error);
    return null;
  }
}

/**
 * Add a member to a team
 */
export async function addTeamMember(
  teamId: string,
  userId: string
): Promise<TeamMember> {
  try {
    const [member] = await db
      .insert(teamMembers)
      .values({ teamId, userId })
      .returning();

    return member;
  } catch (error) {
    console.error("Failed to add team member:", error);
    throw error;
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<void> {
  try {
    await db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))
      );
  } catch (error) {
    console.error("Failed to remove team member:", error);
    throw error;
  }
}

/**
 * Delete a team and all its members (cascade)
 */
export async function deleteTeam(teamId: string): Promise<void> {
  try {
    await db.delete(teams).where(eq(teams.id, teamId));
  } catch (error) {
    console.error("Failed to delete team:", error);
    throw error;
  }
}

/**
 * Check if user is already in a team (optionally scoped to a session)
 */
export async function isUserInTeam(userId: string, sessionId?: string): Promise<boolean> {
  try {
    if (sessionId) {
      const [membership] = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .innerJoin(teams, eq(teams.id, teamMembers.teamId))
        .where(and(eq(teamMembers.userId, userId), eq(teams.sessionId, sessionId)))
        .limit(1);
      return !!membership;
    }

    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId))
      .limit(1);

    return !!membership;
  } catch (error) {
    console.error("Failed to check if user is in team:", error);
    return false;
  }
}

/**
 * Search users by email who have valid contact email in their profile
 * Returns users who can be added to teams
 */
export async function searchUsersByEmailWithContactEmail(
  emailQuery: string,
  sessionId: string
): Promise<
  Array<{
    userId: string;
    displayName: string;
    contactEmail: string;
    images: string[] | null;
    isInTeam: boolean;
  }>
> {
  try {
    // Search profiles by contact email (case-insensitive partial match)
    const matchingProfiles = await db
      .select({
        userId: profiles.userId,
        displayName: profiles.displayName,
        contactEmail: profiles.contactEmail,
        images: profiles.images,
      })
      .from(profiles)
      .where(
        and(
          eq(profiles.sessionId, sessionId),
          sql`LOWER(${profiles.contactEmail}) LIKE LOWER(${"%" + emailQuery + "%"})`
        )
      )
      .limit(10);

    // Filter out profiles without valid email and check team membership
    const results = await Promise.all(
      matchingProfiles
        .filter((p) => p.contactEmail && p.contactEmail.includes("@"))
        .map(async (profile) => {
          const inTeam = await isUserInTeam(profile.userId, sessionId);
          return {
            userId: profile.userId,
            displayName: profile.displayName,
            contactEmail: profile.contactEmail!,
            images: profile.images,
            isInTeam: inTeam,
          };
        })
    );

    return results;
  } catch (error) {
    console.error("Failed to search users by email:", error);
    return [];
  }
}

/**
 * Get all teams with member count
 */
export async function getAllTeams(): Promise<
  Array<Team & { memberCount: number }>
> {
  try {
    const allTeams = await db.select().from(teams).orderBy(teams.teamNumber);

    const teamsWithCount = await Promise.all(
      allTeams.map(async (team) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, team.id));

        return {
          ...team,
          memberCount: countResult[0]?.count || 0,
        };
      })
    );

    return teamsWithCount;
  } catch (error) {
    console.error("Failed to get all teams:", error);
    return [];
  }
}

/**
 * Get all teams in a session with member count and lead info
 */
export async function getTeamsBySessionId(
  sessionId: string
): Promise<
  Array<
    Team & {
      memberCount: number;
      leadProfile: { displayName: string; images: string[] | null } | null;
    }
  >
> {
  try {
    const sessionTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.sessionId, sessionId))
      .orderBy(teams.teamNumber);

    const teamsWithDetails = await Promise.all(
      sessionTeams.map(async (team) => {
        // Get member count
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, team.id));

        // Get lead profile
        const leadProfile = await db
          .select({
            displayName: profiles.displayName,
            images: profiles.images,
          })
          .from(profiles)
          .where(
            and(
              eq(profiles.userId, team.teamLeadId),
              eq(profiles.sessionId, sessionId)
            )
          )
          .limit(1);

        return {
          ...team,
          memberCount: countResult[0]?.count || 0,
          leadProfile: leadProfile[0] || null,
        };
      })
    );

    return teamsWithDetails;
  } catch (error) {
    console.error("Failed to get teams by session:", error);
    return [];
  }
}

// ==========================================
// SUBMISSION QUERIES
// ==========================================

/**
 * Create a new submission
 */
export async function createSubmission(data: {
  teamId: string;
  projectName: string;
  githubLink: string;
  description: string;
  demoLink?: string;
  techStack: string;
  problemStatement: string;
  fileUploads?: string[];
  sponsorTech?: string[];
  sponsorFeatureFeedback?: string;
  mediaPermission?: string;
  eventFeedback?: string;
}): Promise<Submission> {
  try {
    const [submission] = await db
      .insert(submissions)
      .values({
        ...data,
        fileUploads: data.fileUploads || [],
        sponsorTech: data.sponsorTech || [],
        sponsorFeatureFeedback: data.sponsorFeatureFeedback || null,
        mediaPermission: data.mediaPermission || "false",
        eventFeedback: data.eventFeedback || null,
      })
      .returning();

    return submission;
  } catch (error) {
    console.error("Failed to create submission:", error);
    throw error;
  }
}

/**
 * Update a submission
 */
export async function updateSubmission(
  id: string,
  data: {
    projectName?: string;
    githubLink?: string;
    description?: string;
    demoLink?: string;
    techStack?: string;
    problemStatement?: string;
    fileUploads?: string[];
    sponsorTech?: string[];
    sponsorFeatureFeedback?: string;
    mediaPermission?: string;
    eventFeedback?: string;
  }
): Promise<Submission> {
  try {
    const [submission] = await db
      .update(submissions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, id))
      .returning();

    return submission;
  } catch (error) {
    console.error("Failed to update submission:", error);
    throw error;
  }
}

/**
 * Get submission by team ID
 */
export async function getSubmissionByTeamId(
  teamId: string
): Promise<Submission | null> {
  try {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.teamId, teamId))
      .limit(1);

    return submission || null;
  } catch (error) {
    console.error("Failed to get submission by team id:", error);
    return null;
  }
}

/**
 * Get submission by ID
 */
export async function getSubmissionById(id: string): Promise<Submission | null> {
  try {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);

    return submission || null;
  } catch (error) {
    console.error("Failed to get submission by id:", error);
    return null;
  }
}

/**
 * Delete a judge's score for a specific submission
 */
export async function deleteJudgeScore(judgeId: string, submissionId: string): Promise<void> {
  try {
    await db.delete(judgingScores).where(
      and(
        eq(judgingScores.judgeId, judgeId),
        eq(judgingScores.submissionId, submissionId)
      )
    );
  } catch (error) {
    console.error("Failed to delete judge score:", error);
    throw error;
  }
}

/**
 * Get all submissions with team info
 */
export async function getAllSubmissionsWithTeams(
  sessionId: string
): Promise<
  Array<{
    submission: Submission;
    team: Team;
    members: Array<{
      userId: string;
      displayName: string;
      contactEmail: string | null;
      images: string[] | null;
      isLead: boolean;
    }>;
  }>
> {
  try {
    const allSubmissions = await db
      .select({ submission: submissions })
      .from(submissions)
      .innerJoin(teams, eq(submissions.teamId, teams.id))
      .where(eq(teams.sessionId, sessionId))
      .orderBy(desc(submissions.submittedAt));

    const submissionsWithTeams = await Promise.all(
      allSubmissions.map(async ({ submission }) => {
        const team = await getTeamById(submission.teamId);
        if (!team) {
          return null;
        }

        // Get team members with profiles
        const members = await db
          .select()
          .from(teamMembers)
          .where(eq(teamMembers.teamId, team.id));

        const membersWithProfiles = await Promise.all(
          members.map(async (member) => {
            const [profile] = await db
              .select({
                displayName: profiles.displayName,
                contactEmail: profiles.contactEmail,
                images: profiles.images,
              })
              .from(profiles)
              .where(
                and(
                  eq(profiles.userId, member.userId),
                  eq(profiles.sessionId, sessionId)
                )
              )
              .limit(1);

            return {
              userId: member.userId,
              displayName: profile?.displayName || "Unknown",
              contactEmail: profile?.contactEmail || null,
              images: profile?.images || null,
              isLead: member.userId === team.teamLeadId,
            };
          })
        );

        return {
          submission,
          team,
          members: membersWithProfiles,
        };
      })
    );

    return submissionsWithTeams.filter(Boolean) as Array<{
      submission: Submission;
      team: Team;
      members: Array<{
        userId: string;
        displayName: string;
        contactEmail: string | null;
        images: string[] | null;
        isLead: boolean;
      }>;
    }>;
  } catch (error) {
    console.error("Failed to get all submissions with teams:", error);
    return [];
  }
}

// ==========================================
// JUDGING QUERIES
// ==========================================

/**
 * Get all judges
 */
export async function getAllJudges(): Promise<Judge[]> {
  try {
    return await db.select().from(judges).orderBy(judges.name);
  } catch (error) {
    console.error("Failed to get judges:", error);
    return [];
  }
}

/**
 * Create a new judge
 */
export async function createJudge(name: string): Promise<Judge> {
  try {
    const [judge] = await db
      .insert(judges)
      .values({ name })
      .returning();
    return judge;
  } catch (error) {
    console.error("Failed to create judge:", error);
    throw error;
  }
}

/**
 * Get judge by ID
 */
export async function getJudgeById(id: string): Promise<Judge | null> {
  try {
    const [judge] = await db
      .select()
      .from(judges)
      .where(eq(judges.id, id))
      .limit(1);
    return judge || null;
  } catch (error) {
    console.error("Failed to get judge by id:", error);
    return null;
  }
}

/**
 * Get judge by name
 */
export async function getJudgeByName(name: string): Promise<Judge | null> {
  try {
    const [judge] = await db
      .select()
      .from(judges)
      .where(eq(judges.name, name))
      .limit(1);
    return judge || null;
  } catch (error) {
    console.error("Failed to get judge by name:", error);
    return null;
  }
}

/**
 * Update a judge's group
 */
export async function updateJudgeGroup(judgeId: string, judgingGroup: string): Promise<Judge | null> {
  try {
    const [judge] = await db
      .update(judges)
      .set({ judgingGroup })
      .where(eq(judges.id, judgeId))
      .returning();
    return judge || null;
  } catch (error) {
    console.error("Failed to update judge group:", error);
    return null;
  }
}

/**
 * Create or update a judging score
 */
export async function upsertJudgingScore(data: {
  judgeId: string;
  submissionId: string;
  futurePotential: string;
  demo: string;
  creativity: string;
  pitchingQuality: string;
  brainRot?: string;
  additionalComments?: string;
}): Promise<JudgingScore> {
  try {
    // Check if score already exists
    const [existing] = await db
      .select()
      .from(judgingScores)
      .where(
        and(
          eq(judgingScores.judgeId, data.judgeId),
          eq(judgingScores.submissionId, data.submissionId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing score
      const [score] = await db
        .update(judgingScores)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(judgingScores.id, existing.id))
        .returning();
      return score;
    } else {
      // Create new score
      const [score] = await db
        .insert(judgingScores)
        .values({
          ...data,
          brainRot: data.brainRot || "false",
        })
        .returning();
      return score;
    }
  } catch (error) {
    console.error("Failed to upsert judging score:", error);
    throw error;
  }
}

/**
 * Get all scores by a judge
 */
export async function getScoresByJudge(judgeId: string): Promise<JudgingScore[]> {
  try {
    return await db
      .select()
      .from(judgingScores)
      .where(eq(judgingScores.judgeId, judgeId))
      .orderBy(desc(judgingScores.updatedAt));
  } catch (error) {
    console.error("Failed to get scores by judge:", error);
    return [];
  }
}

/**
 * Get score for a specific submission by a judge
 */
export async function getScoreByJudgeAndSubmission(
  judgeId: string,
  submissionId: string
): Promise<JudgingScore | null> {
  try {
    const [score] = await db
      .select()
      .from(judgingScores)
      .where(
        and(
          eq(judgingScores.judgeId, judgeId),
          eq(judgingScores.submissionId, submissionId)
        )
      )
      .limit(1);
    return score || null;
  } catch (error) {
    console.error("Failed to get score by judge and submission:", error);
    return null;
  }
}

/**
 * Get all scores for a submission
 */
export async function getScoresBySubmission(submissionId: string): Promise<Array<JudgingScore & { judgeName: string; judgeGroup: string | null }>> {
  try {
    const scores = await db
      .select()
      .from(judgingScores)
      .where(eq(judgingScores.submissionId, submissionId));

    const scoresWithJudges = await Promise.all(
      scores.map(async (score) => {
        const judge = await getJudgeById(score.judgeId);
        return {
          ...score,
          judgeName: judge?.name || "Unknown",
          judgeGroup: judge?.judgingGroup || null,
        };
      })
    );

    return scoresWithJudges;
  } catch (error) {
    console.error("Failed to get scores by submission:", error);
    return [];
  }
}

/**
 * Get all judging scores with submission and judge details
 */
export async function getAllJudgingScores(): Promise<
  Array<{
    score: JudgingScore;
    judge: Judge;
    submission: Submission;
    team: Team;
  }>
> {
  try {
    const allScores = await db
      .select()
      .from(judgingScores)
      .orderBy(desc(judgingScores.updatedAt));

    const scoresWithDetails = await Promise.all(
      allScores.map(async (score) => {
        const judge = await getJudgeById(score.judgeId);
        const submission = await getSubmissionById(score.submissionId);
        let team = null;
        if (submission) {
          team = await getTeamById(submission.teamId);
        }

        if (!judge || !submission || !team) {
          return null;
        }

        return {
          score,
          judge,
          submission,
          team,
        };
      })
    );

    return scoresWithDetails.filter(Boolean) as Array<{
      score: JudgingScore;
      judge: Judge;
      submission: Submission;
      team: Team;
    }>;
  } catch (error) {
    console.error("Failed to get all judging scores:", error);
    return [];
  }
}

// ==========================================
// ALUMNI / MULTI-SESSION QUERIES
// ==========================================

/**
 * Check which users had a profile in a given session (for alumni badge detection)
 */
export async function getUserIdsWithProfileInSession(
  userIds: string[],
  sessionId: string
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  try {
    const results = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(
        and(
          inArray(profiles.userId, userIds),
          eq(profiles.sessionId, sessionId)
        )
      );
    return new Set(results.map((r) => r.userId));
  } catch (error) {
    console.error("Failed to get user ids with profile in session:", error);
    return new Set();
  }
}

