import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for Clay callback data
// Clay sends back a chunk of text (summary) along with the LinkedIn URL
const ClayCallbackSchema = z.object({
  linkedin_url: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  summary: z.string().optional(),
  // Allow any other fields Clay might send
}).passthrough();

// POST /api/clay-callback - Receives enriched data from Clay webhook
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log("📥 Received callback from Clay:", JSON.stringify(body, null, 2));

    // Validate the data
    const validation = ClayCallbackSchema.safeParse(body);
    
    if (!validation.success) {
      console.error("❌ Invalid data from Clay:", validation.error);
      return NextResponse.json(
        { error: "Invalid data format", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Extract LinkedIn URL (try different field names)
    const linkedinUrl = data.linkedin_url || data.linkedinUrl;
    
    if (!linkedinUrl) {
      console.warn("⚠️ No LinkedIn URL in callback data");
      return NextResponse.json(
        { error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    // Extract the summary text that Clay sends back
    const summary = data.summary || "";

    if (!summary) {
      console.warn("⚠️ No summary in callback data");
      return NextResponse.json(
        { error: "Summary is required" },
        { status: 400 }
      );
    }

    console.log("✅ Received summary from Clay:", {
      linkedinUrl,
      summaryLength: summary.length,
      summaryPreview: summary.substring(0, 100) + "...",
    });

    // Find the profile by LinkedIn URL and update it with the summary
    const { updateProfileByLinkedInUrl } = await import("@/lib/db/queries");
    const { generateEmbedding } = await import("@/lib/ai/embeddings");
    
    try {
      // Generate embedding for the summary to update "What I Offer"
      console.log("🔄 Generating embedding for enriched summary...");
      const embedding = await generateEmbedding(summary);
      
      // Update both the enrichment summary and the "What I Offer" field
      const updated = await updateProfileByLinkedInUrl(linkedinUrl, {
        linkedinEnrichmentSummary: summary,
        whatIOffer: summary, // Auto-fill "What I Offer" with the enriched summary
        whatIOfferEmbedding: embedding, // Update the embedding too
      });

      if (updated) {
        console.log("✅ Profile updated with enriched data:", {
          profileId: updated.id,
          linkedinUrl,
          summaryLength: summary.length,
          embeddingLength: embedding.length,
        });
      } else {
        console.log("ℹ️ No profile found with this LinkedIn URL:", linkedinUrl);
        console.log("   (Profile may be created later, or LinkedIn URL doesn't match)");
      }
    } catch (dbError) {
      console.error("❌ Error updating profile:", dbError);
      // Don't fail the webhook - Clay expects 200 OK
      // We can retry or handle this later
    }

    return NextResponse.json({
      success: true,
      message: "Summary received and processed",
    });
  } catch (error) {
    console.error("❌ Error processing Clay callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

