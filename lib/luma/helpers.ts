/**
 * Shared helper functions for Luma data processing.
 * Used by both seed-kit/seed-from-csv.ts and app/api/luma-webhook/route.ts
 */

export interface RegistrationAnswers {
  "Title (e.g. SWE) / Field of Study (if in university)"?: string;
  "What's your organisation? (University/Company)"?: string;
  "What best describes you?"?: string;
  "What's your key skillset?"?: string;
  "What is your LinkedIn profile?"?: string;
  "Link to personal website/github/portfolio"?: string;
  "Are you applying as a team? (max 4 per team)"?: string;
  [key: string]: string | undefined;
}

/**
 * Build a profile summary from Luma registration answers.
 * Combines title, organization, description, and skillset into a readable summary.
 */
export function buildProfileSummary(answers: RegistrationAnswers): string | null {
  const parts: string[] = [];

  const title = answers["Title (e.g. SWE) / Field of Study (if in university)"]?.trim();
  const org = answers["What's your organisation? (University/Company)"]?.trim();
  const describes = answers["What best describes you?"]?.trim();
  const skillset = answers["What's your key skillset?"]?.trim();

  if (title && org) {
    parts.push(`${title} at ${org}`);
  } else if (title) {
    parts.push(title);
  } else if (org) {
    parts.push(org);
  }

  if (describes) {
    parts.push(describes);
  }

  if (skillset) {
    parts.push(`Skills: ${skillset}`);
  }

  return parts.length > 0 ? parts.join(". ") : null;
}

/**
 * Extract registration answer by question label from Luma webhook payload.
 * Luma sends registration_answers as an array of { question_id, question_label, answer } objects.
 */
export function extractAnswerByLabel(
  registrationAnswers: Array<{ question_label?: string; answer?: string }> | undefined,
  label: string
): string | null {
  if (!registrationAnswers || !Array.isArray(registrationAnswers)) {
    return null;
  }

  const found = registrationAnswers.find(
    (a) => a.question_label?.toLowerCase() === label.toLowerCase()
  );

  return found?.answer?.trim() || null;
}

/**
 * Convert Luma webhook registration_answers array to RegistrationAnswers object.
 */
export function parseRegistrationAnswers(
  registrationAnswers: Array<{ question_label?: string; answer?: string }> | undefined
): RegistrationAnswers {
  const result: RegistrationAnswers = {};

  if (!registrationAnswers || !Array.isArray(registrationAnswers)) {
    return result;
  }

  for (const item of registrationAnswers) {
    if (item.question_label && item.answer !== undefined) {
      result[item.question_label] = item.answer;
    }
  }

  return result;
}
