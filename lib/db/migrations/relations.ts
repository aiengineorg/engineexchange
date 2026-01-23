import { relations } from "drizzle-orm/relations";
import { user, matchingSessions, profiles, swipes, matches, matchMessages, hackathonParticipants, teams, teamMembers, submissions } from "./schema";

export const matchingSessionsRelations = relations(matchingSessions, ({one, many}) => ({
	user: one(user, {
		fields: [matchingSessions.createdBy],
		references: [user.id]
	}),
	swipes: many(swipes),
	matches: many(matches),
	profiles: many(profiles),
}));

export const userRelations = relations(user, ({one, many}) => ({
	matchingSessions: many(matchingSessions),
	profiles: many(profiles),
	hackathonParticipant: one(hackathonParticipants, {
		fields: [user.verifiedParticipantId],
		references: [hackathonParticipants.id]
	}),
	teams: many(teams),
	teamMembers: many(teamMembers),
}));

export const swipesRelations = relations(swipes, ({one}) => ({
	profile_swipingUserId: one(profiles, {
		fields: [swipes.swipingUserId],
		references: [profiles.id],
		relationName: "swipes_swipingUserId_profiles_id"
	}),
	profile_targetUserId: one(profiles, {
		fields: [swipes.targetUserId],
		references: [profiles.id],
		relationName: "swipes_targetUserId_profiles_id"
	}),
	matchingSession: one(matchingSessions, {
		fields: [swipes.sessionId],
		references: [matchingSessions.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	swipes_swipingUserId: many(swipes, {
		relationName: "swipes_swipingUserId_profiles_id"
	}),
	swipes_targetUserId: many(swipes, {
		relationName: "swipes_targetUserId_profiles_id"
	}),
	matches_user1Id: many(matches, {
		relationName: "matches_user1Id_profiles_id"
	}),
	matches_user2Id: many(matches, {
		relationName: "matches_user2Id_profiles_id"
	}),
	matchMessages: many(matchMessages),
	user: one(user, {
		fields: [profiles.userId],
		references: [user.id]
	}),
	matchingSession: one(matchingSessions, {
		fields: [profiles.sessionId],
		references: [matchingSessions.id]
	}),
}));

export const matchesRelations = relations(matches, ({one, many}) => ({
	profile_user1Id: one(profiles, {
		fields: [matches.user1Id],
		references: [profiles.id],
		relationName: "matches_user1Id_profiles_id"
	}),
	profile_user2Id: one(profiles, {
		fields: [matches.user2Id],
		references: [profiles.id],
		relationName: "matches_user2Id_profiles_id"
	}),
	matchingSession: one(matchingSessions, {
		fields: [matches.sessionId],
		references: [matchingSessions.id]
	}),
	matchMessages: many(matchMessages),
}));

export const matchMessagesRelations = relations(matchMessages, ({one}) => ({
	match: one(matches, {
		fields: [matchMessages.matchId],
		references: [matches.id]
	}),
	profile: one(profiles, {
		fields: [matchMessages.senderId],
		references: [profiles.id]
	}),
}));

export const hackathonParticipantsRelations = relations(hackathonParticipants, ({many}) => ({
	users: many(user),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
	user: one(user, {
		fields: [teams.teamLeadId],
		references: [user.id]
	}),
	teamMembers: many(teamMembers),
	submissions: many(submissions),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
	user: one(user, {
		fields: [teamMembers.userId],
		references: [user.id]
	}),
}));

export const submissionsRelations = relations(submissions, ({one}) => ({
	team: one(teams, {
		fields: [submissions.teamId],
		references: [teams.id]
	}),
}));