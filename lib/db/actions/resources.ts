"use server";

import type { NewResourceParams } from "@/lib/db/schema/resources";
import { insertResourceSchema, resources } from "@/lib/db/schema/resources";
import { embeddings as embeddingsTable } from "@/lib/db/schema";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { auth } from "@/app/(auth)/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export const createResource = async (input: NewResourceParams) => {
  const session = await auth();

  if (!session?.user?.id) {
    return "Unauthorized";
  }

  try {
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content, userId: session.user.id })
      .returning();

    const embeddings = await generateEmbeddings(content);
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      }))
    );

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};

