import { tool } from "ai";
import { z } from "zod";

export const calculator = tool({
  description:
    "Perform mathematical calculations and arithmetic operations. Use this for ANY math including addition, subtraction, multiplication, division, percentages, and complex expressions.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe(
        "The mathematical expression to evaluate (e.g., '450 + 360 + 240', '1050 / 3', '120 * 3')"
      ),
  }),
  execute: async ({ expression }) => {
    try {
      // Remove any potential security risks
      const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");

      // biome-ignore lint/security/noGlobalEval: Safe eval for basic math only
      const result = Function(`"use strict"; return (${sanitized})`)();

      return {
        expression: sanitized,
        result: Number(result),
        success: true,
      };
    } catch (error) {
      return {
        expression,
        error: "Invalid mathematical expression",
        success: false,
      };
    }
  },
});

