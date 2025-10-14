import { tool } from "ai";
import { z } from "zod";

export const sendSupportEmail = tool({
  description:
    "Send a support ticket email with customer issue details. Only call this when you have ALL required information: name, email, issue type, priority level, and detailed description.",
  inputSchema: z.object({
    name: z.string().describe("Customer full name"),
    email: z.string().email().describe("Customer email address"),
    issue: z
      .string()
      .describe("Type of issue (e.g., Login Problem, Billing Issue, etc.)"),
    priority: z
      .enum(["Low", "Medium", "High", "Critical"])
      .describe("Issue priority level"),
    description: z.string().describe("Detailed description of the problem"),
  }),
  execute: async (input) => {
    const { name, email, issue, priority, description } = input;
    try {
      const payload = {
        name,
        email,
        issue,
        priority,
        timestamp: new Date().toISOString(),
        description,
      };

      const response = await fetch(
        "https://hooks.zapier.com/hooks/catch/24060322/u5lhchn/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      return {
        success: true,
        message: `Support ticket created successfully for ${name}. Our team will reach out to you at ${email} shortly.`,
        ticketDetails: {
          name,
          email,
          issue,
          priority,
          timestamp: payload.timestamp,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send email: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

