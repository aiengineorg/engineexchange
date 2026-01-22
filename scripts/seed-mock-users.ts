import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { user } from "@/lib/db/schema";
import { matchingSessions, profiles } from "@/lib/db/schema/matching";
import { generateHashedPassword } from "@/lib/db/utils";
import { generateEmbedding } from "@/lib/ai/embeddings";

// Load environment variables from .env.local
config({ path: ".env.local" });

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Mock user data for testing
const mockUsers = [
  {
    email: "alice@test.com",
    password: "testpass123",
    profile: {
      displayName: "Alice Chen",
      whatIOffer: "Full-stack development expertise with 5 years of experience in React, Node.js, and PostgreSQL. I can help with architecture decisions, code reviews, and mentoring junior developers.",
      whatImLookingFor: "Looking for a co-founder with strong business development and marketing skills. Ideally someone who has experience in B2B SaaS sales and can help with go-to-market strategy.",
      linkedinUrl: "https://linkedin.com/in/alicechen",
    },
  },
  {
    email: "bob@test.com",
    password: "testpass123",
    profile: {
      displayName: "Bob Martinez",
      whatIOffer: "10 years of enterprise sales experience at Fortune 500 companies. Strong network in fintech and healthcare sectors. Expert in B2B sales cycles and enterprise negotiations.",
      whatImLookingFor: "Seeking a technical co-founder who can build scalable products. Interested in AI/ML applications in healthcare or fintech.",
      linkedinUrl: "https://linkedin.com/in/bobmartinez",
    },
  },
  {
    email: "carol@test.com",
    password: "testpass123",
    profile: {
      displayName: "Carol Johnson",
      whatIOffer: "Product management background with experience at Google and Stripe. Strong user research skills and data-driven decision making. Can help define product roadmap and prioritization.",
      whatImLookingFor: "Looking for engineers passionate about developer tools and infrastructure. Interested in building the next generation of developer experience platforms.",
      linkedinUrl: "https://linkedin.com/in/caroljohnson",
    },
  },
  {
    email: "david@test.com",
    password: "testpass123",
    profile: {
      displayName: "David Kim",
      whatIOffer: "Machine learning engineer with PhD in NLP. Published researcher with expertise in LLMs, RAG systems, and production ML pipelines. Can build and deploy AI products from scratch.",
      whatImLookingFor: "Looking for business-minded partners who understand enterprise AI adoption. Need someone who can navigate complex sales cycles and compliance requirements.",
      linkedinUrl: "https://linkedin.com/in/davidkim",
    },
  },
  {
    email: "emma@test.com",
    password: "testpass123",
    profile: {
      displayName: "Emma Wilson",
      whatIOffer: "Design leadership with 8 years at Apple and Airbnb. Expert in design systems, user experience, and building design teams. I bring strong visual and interaction design skills.",
      whatImLookingFor: "Seeking technical co-founders building consumer products. Passionate about wellness, sustainability, or education technology.",
      linkedinUrl: "https://linkedin.com/in/emmawilson",
    },
  },
  {
    email: "frank@test.com",
    password: "testpass123",
    profile: {
      displayName: "Frank Rodriguez",
      whatIOffer: "Serial entrepreneur with 3 successful exits. Deep expertise in fundraising, having raised over $50M across multiple ventures. Strong relationships with top-tier VCs in Silicon Valley.",
      whatImLookingFor: "Looking for technical founders building in climate tech or clean energy. Want to help scale companies solving real environmental challenges.",
      linkedinUrl: "https://linkedin.com/in/frankrodriguez",
    },
  },
  {
    email: "grace@test.com",
    password: "testpass123",
    profile: {
      displayName: "Grace Liu",
      whatIOffer: "Backend infrastructure engineer from AWS. Expert in distributed systems, Kubernetes, and cloud architecture. Built systems handling millions of requests per second.",
      whatImLookingFor: "Seeking product-minded co-founders who can handle customer discovery and GTM. Interested in developer tools, infrastructure, or B2B SaaS.",
      linkedinUrl: "https://linkedin.com/in/graceliu",
    },
  },
  {
    email: "henry@test.com",
    password: "testpass123",
    profile: {
      displayName: "Henry Patel",
      whatIOffer: "Growth marketing expert with experience scaling startups from 0 to 100K users. Deep knowledge of paid acquisition, SEO, and viral growth mechanics. Previously led growth at two unicorns.",
      whatImLookingFor: "Looking for technical co-founders building consumer apps or marketplaces. Passionate about products that improve people's daily lives.",
      linkedinUrl: "https://linkedin.com/in/henrypatel",
    },
  },
  {
    email: "iris@test.com",
    password: "testpass123",
    profile: {
      displayName: "Iris Thompson",
      whatIOffer: "Blockchain and Web3 developer with experience building DeFi protocols. Expert in Solidity, smart contract security, and tokenomics design. Contributed to multiple top-100 crypto projects.",
      whatImLookingFor: "Seeking business co-founders who understand crypto regulations and institutional adoption. Want to build compliant Web3 infrastructure for enterprises.",
      linkedinUrl: "https://linkedin.com/in/iristhompson",
    },
  },
  {
    email: "james@test.com",
    password: "testpass123",
    profile: {
      displayName: "James Wright",
      whatIOffer: "Healthcare industry veteran with 15 years in hospital administration. Deep understanding of healthcare regulations, HIPAA compliance, and clinical workflows. Network of contacts at major health systems.",
      whatImLookingFor: "Looking for technical co-founders building healthcare software. Interested in clinical decision support, patient engagement, or revenue cycle management.",
      linkedinUrl: "https://linkedin.com/in/jameswright",
    },
  },
  {
    email: "kate@test.com",
    password: "testpass123",
    profile: {
      displayName: "Kate Nguyen",
      whatIOffer: "Mobile app developer with 6 years building iOS and Android apps. Expert in React Native and Flutter. Shipped apps with 1M+ downloads. Strong focus on performance optimization and smooth UX.",
      whatImLookingFor: "Seeking a co-founder with strong marketing and user acquisition skills. Want to build the next big consumer mobile app in fitness or productivity space.",
      linkedinUrl: "https://linkedin.com/in/katenguyen",
    },
  },
  {
    email: "liam@test.com",
    password: "testpass123",
    profile: {
      displayName: "Liam O'Connor",
      whatIOffer: "Cybersecurity expert with 12 years in enterprise security. Former CISO at a Fortune 500. Deep expertise in compliance (SOC2, ISO 27001), penetration testing, and security architecture.",
      whatImLookingFor: "Looking for technical co-founders building security tools or compliance automation. Interested in helping startups build secure products from day one.",
      linkedinUrl: "https://linkedin.com/in/liamoconnor",
    },
  },
  {
    email: "maya@test.com",
    password: "testpass123",
    profile: {
      displayName: "Maya Sharma",
      whatIOffer: "Data scientist with expertise in recommendation systems and personalization. PhD from Stanford in computer science. Built ML systems at Netflix that improved engagement by 15%.",
      whatImLookingFor: "Seeking business co-founders in e-commerce or media. Want to apply personalization and AI to transform how people discover products and content.",
      linkedinUrl: "https://linkedin.com/in/mayasharma",
    },
  },
  {
    email: "nathan@test.com",
    password: "testpass123",
    profile: {
      displayName: "Nathan Brooks",
      whatIOffer: "Operations and logistics expert with experience at Amazon and DoorDash. Built fulfillment systems handling 100K+ orders daily. Expert in supply chain optimization and last-mile delivery.",
      whatImLookingFor: "Looking for technical co-founders building in logistics, e-commerce, or food delivery. Want to revolutionize how goods move from A to B.",
      linkedinUrl: "https://linkedin.com/in/nathanbrooks",
    },
  },
  {
    email: "olivia@test.com",
    password: "testpass123",
    profile: {
      displayName: "Olivia Park",
      whatIOffer: "Content strategist and community builder with 100K+ followers across platforms. Expert in creator economy, social media marketing, and building engaged communities from scratch.",
      whatImLookingFor: "Seeking technical co-founders building creator tools or social platforms. Passionate about empowering independent creators and small businesses.",
      linkedinUrl: "https://linkedin.com/in/oliviapark",
    },
  },
  {
    email: "peter@test.com",
    password: "testpass123",
    profile: {
      displayName: "Peter Zhang",
      whatIOffer: "Fintech expert with 8 years at Goldman Sachs and Stripe. Deep knowledge of payments, lending, and banking infrastructure. Can navigate complex financial regulations and partnerships.",
      whatImLookingFor: "Looking for full-stack engineers interested in building modern financial infrastructure. Want to make financial services more accessible globally.",
      linkedinUrl: "https://linkedin.com/in/peterzhang",
    },
  },
  {
    email: "quinn@test.com",
    password: "testpass123",
    profile: {
      displayName: "Quinn Taylor",
      whatIOffer: "EdTech specialist with experience building learning platforms at Coursera and Khan Academy. Expert in instructional design, gamification, and learner engagement metrics.",
      whatImLookingFor: "Seeking technical co-founders passionate about education. Want to build AI-powered tools that make quality education accessible to everyone.",
      linkedinUrl: "https://linkedin.com/in/quinntaylor",
    },
  },
  {
    email: "rachel@test.com",
    password: "testpass123",
    profile: {
      displayName: "Rachel Foster",
      whatIOffer: "Legal tech background with JD from Harvard and 5 years as a corporate attorney. Deep understanding of startup legal needs, contracts, and regulatory compliance.",
      whatImLookingFor: "Looking for engineers interested in legal tech or compliance automation. Want to use AI to make legal services more efficient and accessible.",
      linkedinUrl: "https://linkedin.com/in/rachelfoster",
    },
  },
  {
    email: "sam@test.com",
    password: "testpass123",
    profile: {
      displayName: "Sam Rivera",
      whatIOffer: "Hardware engineer with experience at Tesla and Apple. Expert in IoT, embedded systems, and hardware-software integration. Can take products from prototype to mass manufacturing.",
      whatImLookingFor: "Seeking software co-founders for hardware-enabled startups. Interested in smart home, wearables, or industrial IoT applications.",
      linkedinUrl: "https://linkedin.com/in/samrivera",
    },
  },
];

async function main() {
  console.log("🌱 Starting mock user seeding...\n");

  // Find the existing session (or get it by code if you know it)
  const sessions = await db.select().from(matchingSessions).limit(1);

  if (sessions.length === 0) {
    console.error("❌ No matching sessions found. Please create a session first.");
    await client.end();
    process.exit(1);
  }

  const session = sessions[0];
  console.log(`📋 Found session: "${session.name}" (code: ${session.code})\n`);

  for (const mockUser of mockUsers) {
    console.log(`\n👤 Processing user: ${mockUser.email}`);

    // Check if user already exists
    const existingUsers = await db.select().from(user).where(eq(user.email, mockUser.email));

    let userId: string;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`   ✓ User already exists (id: ${userId})`);
    } else {
      // Create user
      const hashedPassword = generateHashedPassword(mockUser.password);
      const [newUser] = await db
        .insert(user)
        .values({
          email: mockUser.email,
          password: hashedPassword,
        })
        .returning();

      userId = newUser.id;
      console.log(`   ✓ Created user (id: ${userId})`);
    }

    // Check if profile already exists for this session
    const existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const hasProfileInSession = existingProfiles.some(p => p.sessionId === session.id);

    if (hasProfileInSession) {
      console.log(`   ✓ Profile already exists in session`);
      continue;
    }

    // Generate embeddings
    console.log(`   ⏳ Generating embeddings...`);
    const [offerEmbedding, lookingForEmbedding] = await Promise.all([
      generateEmbedding(mockUser.profile.whatIOffer),
      generateEmbedding(mockUser.profile.whatImLookingFor),
    ]);

    // Create profile
    const [profile] = await db
      .insert(profiles)
      .values({
        userId,
        sessionId: session.id,
        displayName: mockUser.profile.displayName,
        images: [],
        whatIOffer: mockUser.profile.whatIOffer,
        whatIOfferEmbedding: offerEmbedding,
        whatImLookingFor: mockUser.profile.whatImLookingFor,
        whatImLookingForEmbedding: lookingForEmbedding,
        linkedinUrl: mockUser.profile.linkedinUrl,
      })
      .returning();

    console.log(`   ✓ Created profile: ${profile.displayName} (id: ${profile.id})`);
  }

  console.log("\n✅ Mock user seeding complete!");
  console.log(`\n📝 Test credentials for all users:`);
  console.log(`   Password: testpass123`);
  console.log(`   Emails: ${mockUsers.map(u => u.email).join(", ")}`);

  await client.end();
}

main().catch((error) => {
  console.error("Failed to seed mock users:", error);
  process.exit(1);
});
