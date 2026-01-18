import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getProfileByUserAndSession, getSwipesByProfile } from "@/lib/db/queries";
import { searchProfilesByVector } from "@/lib/matching/vector-search";

// GET /api/feed/discover?sessionId={id}&query={text}&searchField={field}&test=true
// Returns profiles ordered by vector similarity
// Use test=true to get mock test cards for layout testing
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const customQuery = searchParams.get("query");
  const searchField = searchParams.get("searchField") || "offers";
  const testMode = searchParams.get("test") === "true";

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  // Return test cards for layout testing
  if (testMode) {
    const testProfiles = [
      {
        id: "test-1",
        displayName: "Alex Chen",
        whatIOffer: "Full-stack development expertise with React, Node.js, and PostgreSQL. 5+ years building scalable web applications. Happy to mentor junior developers and provide code reviews.",
        whatImLookingFor: "Looking for a co-founder for a B2B SaaS startup. Need someone with sales/marketing experience who can help with go-to-market strategy.",
        similarity: 0.92,
        matchReason: "Strong technical background matches your need for a technical co-founder. Their mentorship offering aligns with your interest in learning.",
        images: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"],
        currentRole: "Senior Software Engineer",
        currentCompany: "Stripe",
        university: "Stanford University",
        linkedinUrl: "https://linkedin.com/in/alexchen",
        twitterUrl: "https://x.com/alexchen",
        githubUrl: "https://github.com/alexchen",
      },
      {
        id: "test-2",
        displayName: "Sarah Miller",
        whatIOffer: "Growth marketing expertise - helped 3 startups scale from 0 to 100k users. Can help with SEO, content strategy, and paid acquisition.",
        whatImLookingFor: "Seeking technical advisors for my edtech startup. Need help with AI/ML integration and building recommendation systems.",
        similarity: 0.87,
        matchReason: "Her marketing expertise complements your technical skills perfectly for startup collaboration.",
        images: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"],
        currentRole: "Head of Growth",
        currentCompany: "Notion",
        university: "UC Berkeley",
        linkedinUrl: "https://linkedin.com/in/sarahmiller",
        twitterUrl: "https://x.com/sarahmiller",
        githubUrl: "",
      },
      {
        id: "test-3",
        displayName: "Marcus Johnson",
        whatIOffer: "VC connections and fundraising guidance. Previously raised $15M Series A. Can intro to 20+ investors in the enterprise software space.",
        whatImLookingFor: "Looking for AI/ML engineers to join my advisory board. Interested in healthcare and fintech applications.",
        similarity: 0.81,
        matchReason: "His fundraising experience matches your interest in startup funding guidance.",
        images: ["https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"],
        currentRole: "General Partner",
        currentCompany: "a16z",
        university: "Harvard Business School",
        linkedinUrl: "https://linkedin.com/in/marcusjohnson",
        twitterUrl: "https://x.com/marcusj",
        githubUrl: "",
      },
      {
        id: "test-4",
        displayName: "Emily Zhang",
        whatIOffer: "Product management coaching and career mentorship. 8 years at FAANG companies. Can help with PM interview prep and portfolio reviews.",
        whatImLookingFor: "Want to learn about blockchain development and Web3. Looking for a study buddy or mentor in the space.",
        similarity: 0.76,
        matchReason: "Her PM expertise aligns with your interest in product development skills.",
        images: ["https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"],
        currentRole: "Director of Product",
        currentCompany: "Meta",
        university: "MIT",
        linkedinUrl: "https://linkedin.com/in/emilyzhang",
        twitterUrl: "https://x.com/emilyzhang",
        githubUrl: "https://github.com/emilyzhang",
      },
      {
        id: "test-5",
        displayName: "David Park",
        whatIOffer: "Design system expertise and UI/UX consultation. Built design systems used by 500+ engineers. Figma and component library specialist.",
        whatImLookingFor: "Seeking developers interested in building open-source design tools. Want to collaborate on a new Figma plugin.",
        similarity: 0.73,
        matchReason: "His design system knowledge complements your frontend development interests.",
        images: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"],
        currentRole: "Staff Designer",
        currentCompany: "Figma",
        university: "Rhode Island School of Design",
        linkedinUrl: "https://linkedin.com/in/davidpark",
        twitterUrl: "https://x.com/davidpark",
        githubUrl: "https://github.com/davidpark",
      },
    ];
    return NextResponse.json(testProfiles);
  }

  try {
    console.log("🔍 Discover feed request:", { sessionId, customQuery, searchField });
    
    // Get current user's profile
    const myProfile = await getProfileByUserAndSession({
      userId: session.user.id,
      sessionId,
    });

    if (!myProfile) {
      console.error("❌ Profile not found for user:", session.user.id);
      return NextResponse.json(
        { error: "Profile not found. Create a profile first." },
        { status: 404 }
      );
    }
    
    console.log("✅ Found user profile:", myProfile.id);

    // Get profiles user has already swiped on
    const swipes = await getSwipesByProfile(myProfile.id);
    const excludeProfileIds = [
      myProfile.id,
      ...swipes.map((s) => s.targetUserId),
    ];

    // Determine search parameters
    let embedding: number[] | undefined;
    let targetField: "what_i_offer_embedding" | "what_im_looking_for_embedding";

    if (customQuery) {
      // Custom search mode: user typed their own query
      console.log("🔍 Using custom query mode");
      // Semantic matching: 
      // - "What I'm Looking For" searches against their "What I Offer"
      // - "What I Offer" searches against their "What I'm Looking For"
      targetField =
        searchField === "looking_for"
          ? "what_i_offer_embedding"  // I'm looking for what they offer
          : "what_im_looking_for_embedding";  // I offer what they're looking for
      // Embedding will be generated inside searchProfilesByVector
    } else {
      // Default mode: match my "looking for" against their "offers"
      console.log("📊 Using profile embedding for matching");
      const lookingForEmbedding = myProfile.whatImLookingForEmbedding;
      
      console.log("🔍 Embedding check:", {
        hasEmbedding: !!lookingForEmbedding,
        isArray: Array.isArray(lookingForEmbedding),
        isObject: typeof lookingForEmbedding === 'object',
        length: lookingForEmbedding ? (Array.isArray(lookingForEmbedding) ? lookingForEmbedding.length : 'not array') : 'null',
        constructor: lookingForEmbedding?.constructor?.name,
      });
      
      // Convert pgvector to array if needed
      let embeddingArray: number[] | null = null;
      if (lookingForEmbedding) {
        if (Array.isArray(lookingForEmbedding)) {
          embeddingArray = lookingForEmbedding;
        } else if (typeof lookingForEmbedding === 'string') {
          // Sometimes pgvector returns as string "[1,2,3,...]"
          try {
            embeddingArray = JSON.parse(lookingForEmbedding);
          } catch (e) {
            console.error("Failed to parse embedding string:", e);
          }
        } else if (typeof lookingForEmbedding === 'object') {
          // pgvector might return as object, try to convert
          embeddingArray = Object.values(lookingForEmbedding);
        }
      }
      
      if (!embeddingArray || embeddingArray.length === 0) {
        console.error("❌ Profile missing valid whatImLookingForEmbedding:", {
          profileId: myProfile.id,
          embeddingArray,
        });
        return NextResponse.json(
          { error: "Profile embeddings not ready. Please try again in a moment." },
          { status: 503 }
        );
      }
      
      console.log("✅ Successfully extracted embedding array:", embeddingArray.length);
      embedding = embeddingArray;
      targetField = "what_i_offer_embedding";
    }

    // Perform vector search
    const profiles = await searchProfilesByVector({
      sessionId,
      excludeProfileIds,
      embedding,
      customQuery: customQuery || undefined,
      targetField,
      limit: 50,
      minSimilarity: 0.5,
    });

    // Match reasons are already set in vector-search.ts with proper context

    // searchProfilesByVector already returns clean ProfileSearchResult objects
    // without embedding fields, so they're safe to serialize
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to get discover feed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { 
        error: "Failed to get discover feed",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
