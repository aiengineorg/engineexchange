import { tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/db/queries/embeddings";

export const knowledgeBaseSearch = tool({
  description:
    "Search the AI Engine Warsaw Edition hackathon knowledge base for information about the event, mentors, organizers, tech partners, themes, prizes, judging criteria, logistics, and schedules. ALWAYS use this FIRST before using web search or general knowledge when the question is about the hackathon.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query to find relevant information in the knowledge base (e.g., 'What are the themes?', 'Who are the mentors?', 'What is the judging criteria?')"
      ),
  }),
  execute: async ({ query }) => {
    try {
      const result = await findRelevantContent(query);

      if (!result.success) {
        return {
          query,
          error: result.error,
          results: [],
          found: false,
        };
      }

      if (result.results.length === 0) {
        return {
          query,
          message: "No relevant information found in the knowledge base. You may need to search the web or use general knowledge.",
          results: [],
          found: false,
        };
      }

      return {
        query,
        results: result.results.map((r) => ({
          content: r.content,
          similarity: r.similarity,
          source: r.resource?.content?.split("\n")[0] || "Unknown source", // First line is usually the title
        })),
        found: true,
        totalResults: result.results.length,
      };
    } catch (error) {
      return {
        query,
        error: `Knowledge base search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        results: [],
        found: false,
      };
    }
  },
});

