import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  enrichPersonWithClay,
  generateLinkedInSummary,
} from "@/lib/clay/enrichment";

const EnrichProfileSchema = z.object({
  linkedinUrl: z.string().url(),
  displayName: z.string().optional(),
});

// POST /api/profiles/enrich - Enrich profile with LinkedIn data via Clay
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = EnrichProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { linkedinUrl, displayName } = validation.data;

    console.log("Enriching profile with Clay using LinkedIn URL:", linkedinUrl);
    const enrichmentResult = await enrichPersonWithClay({
      linkedinUrl,
      name: displayName,
    });

    if (!enrichmentResult.success) {
      return NextResponse.json(
        { error: enrichmentResult.error || "Failed to enrich profile" },
        { status: 500 }
      );
    }

    if (!enrichmentResult.data) {
      return NextResponse.json(
        { error: "No enrichment data returned" },
        { status: 500 }
      );
    }

    const summary = generateLinkedInSummary(enrichmentResult.data);

    return NextResponse.json({
      success: true,
      summary,
      data: enrichmentResult.data,
    });
  } catch (error) {
    console.error("Failed to enrich profile:", error);
    return NextResponse.json(
      { error: "Failed to enrich profile" },
      { status: 500 }
    );
  }
}

