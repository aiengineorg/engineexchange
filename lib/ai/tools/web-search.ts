import { tool } from "ai";
import { z } from "zod";

// Rate limiting: Track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Helper function to add delay between requests
async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

export const webSearch = tool({
  description:
    "Search the web for current information, news, facts, and real-time data. Use this when users ask about current events, recent information, or anything that requires up-to-date knowledge. Note: Searches are rate-limited, so make each search count.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query (e.g., 'latest AI news', 'TypeScript tutorial', 'weather forecast')"
      ),
  }),
  execute: async ({ query }) => {
    try {
      const apiKey = process.env.BRAVE_API_KEY;
      
      if (!apiKey) {
        throw new Error("BRAVE_API_KEY environment variable is not set");
      }

      // Apply rate limiting
      await rateLimit();

      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            "X-Subscription-Token": apiKey,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          return {
            query,
            error: "Rate limit reached. Please wait a moment before making more searches.",
            results: [],
            rateLimited: true,
          };
        }
        throw new Error(`Search API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Return top 5 results in a clean format
      const results =
        data.web?.results?.slice(0, 5).map((result: {
          title: string;
          url: string;
          description: string;
        }) => ({
          title: result.title,
          url: result.url,
          description: result.description,
        })) || [];

      return {
        query,
        results,
        totalResults: data.web?.results?.length || 0,
        rateLimited: false,
      };
    } catch (error) {
      return {
        query,
        error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        results: [],
        rateLimited: false,
      };
    }
  },
});

