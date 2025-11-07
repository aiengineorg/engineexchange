import { config } from "dotenv";

// Load .env.local if it exists
config({
  path: ".env.local",
});

const testClayCallback = async () => {
  // Use localhost for local testing, or your deployed URL
  const callbackUrl = process.env.CLAY_CALLBACK_URL || "http://localhost:3000/api/clay-callback";
  const testData = {
    linkedin_url: "https://www.linkedin.com/in/keerthanen-ravichandran/",
    summary: "This is a test summary from Clay. It contains enriched information about the LinkedIn profile including name, job title, company, location, and professional summary.",
  };

  console.log("🧪 Testing Clay Callback Webhook");
  console.log("Callback URL:", callbackUrl);
  console.log("Test data:", JSON.stringify(testData, null, 2));
  console.log("");

  try {
    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log("Response:", responseText);

    if (response.ok) {
      console.log("\n✅ Webhook callback is working!");
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log("Parsed response:", JSON.stringify(jsonResponse, null, 2));
      } catch {
        // Not JSON, that's okay
      }
    } else {
      console.log("\n❌ Webhook returned an error");
    }
  } catch (error) {
    console.error("❌ Error calling webhook:", error);
    if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Make sure your Next.js dev server is running:");
      console.log("   pnpm dev");
    }
  }
};

testClayCallback()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });

