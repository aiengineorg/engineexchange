import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for Clay callback data
// Clay sends back enriched LinkedIn data including profile details
const ClayCallbackSchema = z.object({
  // Core identifiers
  profile_id: z.string().optional(),
  profileId: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  event_name: z.string().optional(),
  eventName: z.string().optional(),

  // Basic profile info
  first_name: z.string().optional(),
  firstName: z.string().optional(),
  last_name: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),

  // Professional details (can be arrays or JSON strings)
  education: z.union([z.array(z.any()), z.string()]).optional(),
  experience: z.union([z.array(z.any()), z.string()]).optional(),

  // Additional info
  location: z.string().optional(),
  connections: z.number().optional(),
  profile_picture: z.string().url().optional(),
  profilePicture: z.string().url().optional(),

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

    // Extract fields (try different field name variations)
    const profileId = data.profile_id || data.profileId;
    const linkedinUrl = data.linkedin_url || data.linkedinUrl;
    const email = data.email;
    const eventName = data.event_name || data.eventName;
    const firstName = data.first_name || data.firstName;
    const lastName = data.last_name || data.lastName;
    const title = data.title;
    const headline = data.headline;
    const summary = data.summary || "";
    const location = data.location;
    const connections = data.connections;
    const profilePicture = data.profile_picture || data.profilePicture;

    // Handle education and experience (convert arrays to JSON strings if needed)
    const education = Array.isArray(data.education)
      ? JSON.stringify(data.education)
      : data.education;
    const experience = Array.isArray(data.experience)
      ? JSON.stringify(data.experience)
      : data.experience;

    if (!linkedinUrl) {
      console.warn("⚠️ No LinkedIn URL in callback data");
      return NextResponse.json(
        { error: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    console.log("✅ Received enriched data from Clay:", {
      profileId,
      linkedinUrl,
      email,
      firstName,
      lastName,
      hasEducation: !!education,
      hasExperience: !!experience,
    });

    // Import database utilities
    const { updateProfileByLinkedInUrl, db } = await import("@/lib/db/queries");
    const { generateEmbedding } = await import("@/lib/ai/embeddings");
    const { userDetails } = await import("@/lib/db/schema");

    try {
      // Step 1: Save to user_details table
      console.log("💾 Saving enriched data to user_details table...");
      const userDetailRecord = await db.insert(userDetails).values({
        profileId,
        linkedinUrl,
        email,
        eventName,
        firstName,
        lastName,
        title,
        headline,
        summary,
        education,
        experience,
        location,
        connections,
        profilePicture,
      }).returning();

      console.log("✅ User details saved:", {
        id: userDetailRecord[0]?.id,
        profileId,
        linkedinUrl,
      });

      // Step 2: Update the existing profile (if summary is provided)
      if (summary) {
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
      }
    } catch (dbError) {
      console.error("❌ Error saving enriched data:", dbError);
      // Don't fail the webhook - Clay expects 200 OK
      // We can retry or handle this later
    }

    return NextResponse.json({
      success: true,
      message: "Enriched data received and processed",
    });
  } catch (error) {
    console.error("❌ Error processing Clay callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

