/**
 * Resend Email Service
 * Handles sending transactional emails for verification codes
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ResendEmailResponse {
  id: string;
}

export class ResendClient {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail?: string) {
    if (!apiKey) {
      throw new Error("Resend API key is required");
    }
    this.apiKey = apiKey;
    // Default to onboarding@resend.dev for testing, update in production
    this.fromEmail = fromEmail || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  }

  async sendEmail(options: SendEmailOptions): Promise<ResendEmailResponse> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

/**
 * Create a Resend client instance from environment variable
 */
export function createResendClient(): ResendClient {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return new ResendClient(apiKey);
}

/**
 * Generate verification code email HTML
 */
export function generateVerificationCodeEmailHtml(options: {
  code: string;
  appName?: string;
}): string {
  const appName = options.appName || "BFL Hackathon";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${appName}</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Here's your verification code:</p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background: #f5f5f5; padding: 20px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
        ${options.code}
      </div>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center;">
      This code will expire in 10 minutes.
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 12px; color: #888; text-align: center;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate verification code email plain text
 */
export function generateVerificationCodeEmailText(options: {
  code: string;
  appName?: string;
}): string {
  const appName = options.appName || "BFL Hackathon";

  return `
${appName} - Verification Code

Your verification code is: ${options.code}

This code will expire in 10 minutes.

If you didn't request this code, you can safely ignore this email.
  `.trim();
}
