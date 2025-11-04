import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

const embeddingModel = openai.embedding("text-embedding-ada-002");

/**
 * Generate a single embedding vector for profile text
 * Used for semantic matching in the dating app
 */
export const generateEmbedding = async (
  text: string
): Promise<number[]> => {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text.trim(),
  });
  return embedding;
};

