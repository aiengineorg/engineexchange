export const SPONSOR_TECH_OPTIONS = ["JetBrains", "OpenAI", "Anthropic"] as const;

export type SponsorTechOption = (typeof SPONSOR_TECH_OPTIONS)[number];
