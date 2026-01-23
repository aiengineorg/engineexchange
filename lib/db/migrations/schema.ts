import { pgTable, foreignKey, unique, uuid, text, timestamp, index, uniqueIndex, vector, boolean, varchar, jsonb } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const matchingSessions = pgTable("matching_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		matchingSessionsCreatedByUserIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "matching_sessions_created_by_User_id_fk"
		}).onDelete("cascade"),
		matchingSessionsCodeKey: unique("matching_sessions_code_key").on(table.code),
	}
});

export const swipes = pgTable("swipes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	swipingUserId: uuid("swiping_user_id").notNull(),
	targetUserId: uuid("target_user_id").notNull(),
	sessionId: uuid("session_id").notNull(),
	decision: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		swipingUserIdx: index("swiping_user_idx").using("btree", table.swipingUserId.asc().nullsLast(), table.sessionId.asc().nullsLast()),
		targetUserIdx: index("target_user_idx").using("btree", table.targetUserId.asc().nullsLast(), table.sessionId.asc().nullsLast()),
		uniqueSwipe: uniqueIndex("unique_swipe").using("btree", table.swipingUserId.asc().nullsLast(), table.targetUserId.asc().nullsLast()),
		swipesSwipingUserIdProfilesIdFk: foreignKey({
			columns: [table.swipingUserId],
			foreignColumns: [profiles.id],
			name: "swipes_swiping_user_id_profiles_id_fk"
		}).onDelete("cascade"),
		swipesTargetUserIdProfilesIdFk: foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [profiles.id],
			name: "swipes_target_user_id_profiles_id_fk"
		}).onDelete("cascade"),
		swipesSessionIdMatchingSessionsIdFk: foreignKey({
			columns: [table.sessionId],
			foreignColumns: [matchingSessions.id],
			name: "swipes_session_id_matching_sessions_id_fk"
		}).onDelete("cascade"),
	}
});

export const matches = pgTable("matches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user1Id: uuid("user1_id").notNull(),
	user2Id: uuid("user2_id").notNull(),
	sessionId: uuid("session_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		matchSessionIdx: index("match_session_idx").using("btree", table.sessionId.asc().nullsLast()),
		uniqueMatch: uniqueIndex("unique_match").using("btree", table.user1Id.asc().nullsLast(), table.user2Id.asc().nullsLast()),
		user1Idx: index("user1_idx").using("btree", table.user1Id.asc().nullsLast()),
		user2Idx: index("user2_idx").using("btree", table.user2Id.asc().nullsLast()),
		matchesUser1IdProfilesIdFk: foreignKey({
			columns: [table.user1Id],
			foreignColumns: [profiles.id],
			name: "matches_user1_id_profiles_id_fk"
		}).onDelete("cascade"),
		matchesUser2IdProfilesIdFk: foreignKey({
			columns: [table.user2Id],
			foreignColumns: [profiles.id],
			name: "matches_user2_id_profiles_id_fk"
		}).onDelete("cascade"),
		matchesSessionIdMatchingSessionsIdFk: foreignKey({
			columns: [table.sessionId],
			foreignColumns: [matchingSessions.id],
			name: "matches_session_id_matching_sessions_id_fk"
		}).onDelete("cascade"),
	}
});

export const matchMessages = pgTable("match_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matchId: uuid("match_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		matchCreatedIdx: index("match_created_idx").using("btree", table.matchId.asc().nullsLast(), table.createdAt.asc().nullsLast()),
		matchMessagesMatchIdMatchesIdFk: foreignKey({
			columns: [table.matchId],
			foreignColumns: [matches.id],
			name: "match_messages_match_id_matches_id_fk"
		}).onDelete("cascade"),
		matchMessagesSenderIdProfilesIdFk: foreignKey({
			columns: [table.senderId],
			foreignColumns: [profiles.id],
			name: "match_messages_sender_id_profiles_id_fk"
		}).onDelete("cascade"),
	}
});

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionId: uuid("session_id").notNull(),
	displayName: text("display_name").notNull(),
	images: text().array().default([""]),
	whatIOffer: text("what_i_offer").notNull(),
	whatIOfferEmbedding: vector("what_i_offer_embedding", { dimensions: 1536 }),
	whatImLookingFor: text("what_im_looking_for").notNull(),
	whatImLookingForEmbedding: vector("what_im_looking_for_embedding", { dimensions: 1536 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	linkedinUrl: text("linkedin_url"),
	linkedinEnrichmentSummary: text("linkedin_enrichment_summary"),
	websiteOrGithub: text("website_or_github"),
	hasTeam: boolean("has_team").default(false),
	websiteUrl: text("website_url"),
	contactEmail: text("contact_email"),
},
(table) => {
	return {
		lookingForEmbeddingHnswIdx: index("looking_for_embedding_hnsw_idx").using("hnsw", table.whatImLookingForEmbedding.asc().nullsLast().op("vector_cosine_ops")),
		offerEmbeddingHnswIdx: index("offer_embedding_hnsw_idx").using("hnsw", table.whatIOfferEmbedding.asc().nullsLast().op("vector_cosine_ops")),
		sessionIdx: index("session_idx").using("btree", table.sessionId.asc().nullsLast()),
		userIdx: index("user_idx").using("btree", table.userId.asc().nullsLast()),
		userSessionUnique: uniqueIndex("user_session_unique").using("btree", table.userId.asc().nullsLast(), table.sessionId.asc().nullsLast()),
		profilesUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "profiles_user_id_User_id_fk"
		}).onDelete("cascade"),
		profilesSessionIdMatchingSessionsIdFk: foreignKey({
			columns: [table.sessionId],
			foreignColumns: [matchingSessions.id],
			name: "profiles_session_id_matching_sessions_id_fk"
		}).onDelete("cascade"),
	}
});

export const user = pgTable("User", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 64 }),
	discordId: varchar("discord_id", { length: 32 }),
	claimToken: varchar("claim_token", { length: 64 }),
	claimTokenExpiresAt: timestamp("claim_token_expires_at", { mode: 'string' }),
	lumaGuestId: varchar("luma_guest_id", { length: 64 }),
	displayName: varchar("display_name", { length: 128 }),
	lumaRegistrationData: jsonb("luma_registration_data"),
	emailVerificationToken: varchar("email_verification_token", { length: 8 }),
	emailToVerify: varchar("email_to_verify", { length: 256 }),
	emailVerificationExpiresAt: timestamp("email_verification_expires_at", { mode: 'string' }),
	verifiedParticipantId: uuid("verified_participant_id"),
},
(table) => {
	return {
		userClaimTokenIdx: index("user_claim_token_idx").using("btree", table.claimToken.asc().nullsLast()).where(sql`(claim_token IS NOT NULL)`),
		userEmailVerificationTokenIdx: index("user_email_verification_token_idx").using("btree", table.emailVerificationToken.asc().nullsLast()),
		userLumaGuestIdIdx: index("user_luma_guest_id_idx").using("btree", table.lumaGuestId.asc().nullsLast()).where(sql`(luma_guest_id IS NOT NULL)`),
		userVerifiedParticipantIdFkey: foreignKey({
			columns: [table.verifiedParticipantId],
			foreignColumns: [hackathonParticipants.id],
			name: "User_verified_participant_id_fkey"
		}),
	}
});

export const hackathonParticipants = pgTable("hackathon_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 256 }),
	email: varchar({ length: 256 }).notNull(),
	linkedin: varchar({ length: 512 }),
	websiteOrGithub: varchar("website_or_github", { length: 512 }),
	lumaId: varchar("luma_id", { length: 64 }),
	profileSummary: text("profile_summary"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	hasTeam: boolean("has_team").default(false),
},
(table) => {
	return {
		emailIdx: index("hackathon_participants_email_idx").using("btree", table.email.asc().nullsLast()),
		hackathonParticipantsEmailKey: unique("hackathon_participants_email_key").on(table.email),
	}
});

export const teams = pgTable("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	teamNumber: varchar("team_number", { length: 50 }).notNull(),
	teamLeadId: uuid("team_lead_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		teamLeadIdx: index("team_lead_idx").using("btree", table.teamLeadId.asc().nullsLast()),
		teamsTeamLeadIdFkey: foreignKey({
			columns: [table.teamLeadId],
			foreignColumns: [user.id],
			name: "teams_team_lead_id_fkey"
		}).onDelete("cascade"),
		teamsTeamNumberKey: unique("teams_team_number_key").on(table.teamNumber),
	}
});

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id").notNull(),
	addedAt: timestamp("added_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		teamMemberTeamIdx: index("team_member_team_idx").using("btree", table.teamId.asc().nullsLast()),
		userUniqueTeamIdx: uniqueIndex("user_unique_team_idx").using("btree", table.userId.asc().nullsLast()),
		teamMembersTeamIdFkey: foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_members_team_id_fkey"
		}).onDelete("cascade"),
		teamMembersUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "team_members_user_id_fkey"
		}).onDelete("cascade"),
	}
});

export const submissions = pgTable("submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	projectName: text("project_name").notNull(),
	githubLink: text("github_link").notNull(),
	description: text().notNull(),
	demoLink: text("demo_link"),
	techStack: text("tech_stack").notNull(),
	problemStatement: text("problem_statement").notNull(),
	fileUploads: jsonb("file_uploads").default([]),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		submissionTeamIdx: uniqueIndex("submission_team_idx").using("btree", table.teamId.asc().nullsLast()),
		submissionsTeamIdFkey: foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "submissions_team_id_fkey"
		}).onDelete("cascade"),
		submissionsTeamIdKey: unique("submissions_team_id_key").on(table.teamId),
	}
});