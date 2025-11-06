import { config } from "dotenv";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { user, profiles } from "../lib/db/schema";
import { generateEmbedding } from "../lib/ai/embeddings";
import { nanoid } from "nanoid";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

const SESSION_ID = "ab6cf149-199e-4c66-85ab-3f114912ce3b";

const mockProfiles = [
  {
    email: "sarah.tech@example.com",
    displayName: "Sarah Chen",
    whatIOffer: "I'm a full-stack engineer with 6 years of experience in React, Node.js, and Python. I've built scalable SaaS products from scratch and love teaching others. Strong technical leadership, agile methodologies, and product thinking. Always excited to pair program and share knowledge about system design and architecture.",
    whatImLookingFor: "Looking for a business co-founder who understands growth marketing, sales, and customer development. Someone who can complement my technical skills with strong business acumen and has experience scaling B2B products. Must be passionate about building in the AI/ML space.",
  },
  {
    email: "mike.bizdev@example.com",
    displayName: "Mike Rodriguez",
    whatIOffer: "10 years in business strategy and growth. Sold my last startup to a Fortune 500. Expert in B2B sales, fundraising (raised $5M), and go-to-market strategy. Strong network in enterprise tech. Can close deals, build partnerships, and scale revenue from 0 to $10M ARR.",
    whatImLookingFor: "Seeking a technical co-founder who can build AI-powered products. Need someone who's opinionated about architecture, loves clean code, and can ship fast. Bonus if you have experience with LLMs, vector databases, or building developer tools.",
  },
  {
    email: "emily.product@example.com",
    displayName: "Emily Watson",
    whatIOffer: "Product design leader with strong UX research skills and front-end development experience (React, TypeScript). I've designed products used by millions and understand both the creative and technical aspects. Great at user interviews, rapid prototyping, and creating design systems. Can also code and contribute to the frontend.",
    whatImLookingFor: "Looking for backend engineers or full-stack developers to collaborate on a fintech idea. Need someone who's passionate about beautiful, intuitive interfaces but can also build robust APIs. Interest in payments, crypto, or financial infrastructure is a plus.",
  },
  {
    email: "alex.ml@example.com",
    displayName: "Alex Kumar",
    whatIOffer: "Specialized in large language models, RAG systems, and vector search. Built production ML pipelines at scale. Expert in Python, PyTorch, and infrastructure for AI applications. Strong understanding of embeddings, fine-tuning, and prompt engineering. Published papers on NLP and have experience deploying models to production.",
    whatImLookingFor: "Seeking someone with business development or product management skills to help commercialize AI technology. Need help identifying market opportunities, talking to customers, and building a sustainable business model around ML/AI products. Experience in enterprise sales would be amazing.",
  },
  {
    email: "jessica.data@example.com",
    displayName: "Jessica Park",
    whatIOffer: "Expert in data analytics, business intelligence, and building data-driven cultures. Proficient in SQL, Python, and visualization tools. I've built entire analytics stacks and know how to derive actionable insights from complex datasets. Strong communicator who can translate technical findings to business stakeholders.",
    whatImLookingFor: "Looking for engineers or product people interested in building analytics/BI tools for modern data teams. Need someone who understands databases, APIs, and can think about scalability. Bonus if you're excited about the modern data stack or AI-powered analytics.",
  },
  {
    email: "david.devrel@example.com",
    displayName: "David Thompson",
    whatIOffer: "Developer relations expert with strong technical background in cloud infrastructure and DevOps. I've grown developer communities from 0 to 50k+ members, created technical content that went viral, and understand how to make developers love your product. Strong writer, speaker, and community builder. Can handle docs, tutorials, and developer experience.",
    whatImLookingFor: "Seeking technical founders building developer tools, infrastructure, or APIs. Need help getting your first 1000 developers, creating amazing docs, or building community? I can be your first DevRel hire or co-founder. Must be open source friendly and developer-focused.",
  },
  {
    email: "rachel.ops@example.com",
    displayName: "Rachel Kim",
    whatIOffer: "Operational excellence expert with experience scaling startups from 10 to 100+ people. I set up processes, hire teams, manage budgets, and ensure smooth operations. Strong in project management, HR/recruiting, and building operational infrastructure. Can be the 'adult in the room' while you focus on product and growth.",
    whatImLookingFor: "Looking for ambitious founders building in fintech, healthcare tech, or enterprise SaaS. Need someone to handle operations, hiring, and day-to-day management? I can be your co-founder or first COO. Must be well-funded or have clear path to revenue.",
  },
  {
    email: "tom.security@example.com",
    displayName: "Tom Anderson",
    whatIOffer: "15 years in cybersecurity, penetration testing, and security architecture. I've built security programs from scratch, passed SOC 2 audits, and handled incident response. Expert in cloud security (AWS, GCP), zero trust, and compliance. Can ensure your product is secure and enterprise-ready from day one.",
    whatImLookingFor: "Seeking technical or business co-founders building in security, privacy, or compliance space. Or need a security-focused technical co-founder for any B2B SaaS? I can handle all things security while you focus on core product. Must be passionate about keeping users safe.",
  },
  {
    email: "lisa.mobile@example.com",
    displayName: "Lisa Martinez",
    whatIOffer: "Mobile development expert with apps that have millions of downloads. Specialized in React Native and Flutter, with strong native iOS and Android skills. I care deeply about performance, UX, and delightful mobile experiences. Can handle app store optimization, push notifications, and mobile-specific challenges.",
    whatImLookingFor: "Looking for backend engineers or business-minded founders to build consumer mobile apps with. Interested in social, wellness, productivity, or creator tools. Need someone who can handle the backend/API while I make the mobile experience incredible. Must love mobile-first thinking.",
  },
  {
    email: "james.blockchain@example.com",
    displayName: "James Wu",
    whatIOffer: "Smart contract development expert with deep knowledge of Ethereum, Solidity, and DeFi protocols. Built multiple successful DApps and understand tokenomics, DAOs, and web3 infrastructure. Can handle everything from smart contracts to web3 frontend integration. Strong security mindset and crypto-native thinking.",
    whatImLookingFor: "Seeking co-founders interested in web3, crypto, or decentralized technologies. Need help with traditional web development, mobile, or business strategy. Looking to build the next generation of decentralized applications. Must be crypto-curious or web3-native.",
  },
];

async function main() {
  // biome-ignore lint: Forbidden non-null assertion
  const connectionString = process.env.POSTGRES_URL!;
  
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is not set");
  }
  
  console.log("🔌 Connecting to database...");
  const client = postgres(connectionString, {
    ssl: 'require',
    max: 1,
  });
  const db = drizzle(client);

  console.log("🚀 Starting mock profile generation...");
  console.log(`📍 Target session: ${SESSION_ID}\n`);

  for (const mockProfile of mockProfiles) {
    try {
      console.log(`\n👤 Creating user: ${mockProfile.displayName} (${mockProfile.email})`);

      // Create user with random password (they won't actually log in)
      const [newUser] = await db
        .insert(user)
        .values({
          email: mockProfile.email,
          password: `mock_${nanoid(20)}`, // Random password hash
        })
        .onConflictDoNothing()
        .returning();

      if (!newUser) {
        console.log(`   ⚠️  User already exists, fetching...`);
        const [existingUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, mockProfile.email))
          .limit(1);
        
        if (!existingUser) {
          throw new Error("Could not find or create user");
        }

        console.log(`   ✅ Found existing user: ${existingUser.id}`);
        continue; // Skip if user already exists
      }

      console.log(`   ✅ User created: ${newUser.id}`);

      // Generate embeddings
      console.log(`   🧠 Generating embeddings...`);
      const [offerEmbedding, lookingForEmbedding] = await Promise.all([
        generateEmbedding(mockProfile.whatIOffer),
        generateEmbedding(mockProfile.whatImLookingFor),
      ]);
      console.log(`   ✅ Embeddings generated (${offerEmbedding.length} dimensions)`);

      // Create profile
      console.log(`   📝 Creating profile in session...`);
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: newUser.id,
          sessionId: SESSION_ID,
          displayName: mockProfile.displayName,
          images: [],
          whatIOffer: mockProfile.whatIOffer,
          whatIOfferEmbedding: offerEmbedding,
          whatImLookingFor: mockProfile.whatImLookingFor,
          whatImLookingForEmbedding: lookingForEmbedding,
        })
        .returning();

      console.log(`   ✅ Profile created: ${newProfile.id}`);
      console.log(`   🎉 ${mockProfile.displayName} is ready to match!`);
    } catch (error) {
      console.error(`   ❌ Error creating ${mockProfile.displayName}:`, error);
    }
  }

  console.log("\n\n✅ Mock profile generation complete!");
  console.log(`📊 Created ${mockProfiles.length} profiles for testing`);
  console.log(`🔗 Session ID: ${SESSION_ID}`);
  console.log("\n🎯 You can now test:");
  console.log("   - Vector similarity search");
  console.log("   - Semantic matching");
  console.log("   - Swipe functionality");
  console.log("   - Match creation\n");

  await client.end();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

