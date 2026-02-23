import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// Active hackathon session ID — change env var to switch to a new session
export const DEFAULT_SESSION_ID =
  process.env.DEFAULT_SESSION_ID ||
  "1784d222-27f9-4fed-a28f-f454444e760f";

// Previous session ID for BFL Hack alumni badge detection
export const BFL_HACK_SESSION_ID = "1784d222-27f9-4fed-a28f-f454444e760f";

// Submissions configuration — toggle via env vars or change defaults here
export const SUBMISSIONS_OPEN =
  process.env.SUBMISSIONS_OPEN !== undefined
    ? process.env.SUBMISSIONS_OPEN === "true"
    : true; // default: open

export const SUBMISSION_DEADLINE = process.env.SUBMISSION_DEADLINE
  ? new Date(process.env.SUBMISSION_DEADLINE)
  : null; // default: no deadline
