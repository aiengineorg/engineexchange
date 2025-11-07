import { config } from "dotenv";

// Load .env.local if it exists
config({
  path: ".env.local",
});

const testClayWebhook = async () => {
  const webhookUrl = process.env.CLAY_WEBHOOK_URL || "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-7b96cf74-29df-4e88-a128-dbb700c3b031";
  const linkedinUrl = "https://www.linkedin.com/in/keerthanen-ravichandran/";
  const apiKey = process.env.CLAY_API_KEY;

  console.log("🧪 Testing Clay Webhook");
  console.log("Webhook URL:", webhookUrl);
  console.log("LinkedIn URL:", linkedinUrl);
  console.log("");

  // Try different payload formats that Clay might expect
  const payloads = [
    // Format 1: linkedin_url
    {
      linkedin_url: linkedinUrl,
      name: "Keerthanen Ravichandran",
    },
    // Format 2: linkedinUrl
    {
      linkedinUrl: linkedinUrl,
      name: "Keerthanen Ravichandran",
    },
    // Format 3: linkedInUrl
    {
      linkedInUrl: linkedinUrl,
      name: "Keerthanen Ravichandran",
    },
    // Format 4: Just the URL
    {
      url: linkedinUrl,
    },
  ];

  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i];
    console.log(`\n📤 Attempt ${i + 1}: Sending payload:`, JSON.stringify(payload, null, 2));

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add API key if available
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      const responseText = await response.text();
      console.log("Response:", responseText);

      if (response.ok) {
        console.log("✅ Success! Webhook accepted the data.");
        
        // Try to parse as JSON
        try {
          const jsonResponse = JSON.parse(responseText);
          console.log("Parsed response:", JSON.stringify(jsonResponse, null, 2));
        } catch {
          // Not JSON, that's okay
        }
        
        // If this format worked, we can stop
        if (response.status === 200 || response.status === 201) {
          console.log("\n✅ This payload format worked! Use this format in your code.");
          break;
        }
      } else {
        console.log("❌ Webhook returned an error");
      }
    } catch (error) {
      console.error("❌ Error sending to webhook:", error);
    }

    // Wait a bit between attempts
    if (i < payloads.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log("\n✨ Test complete!");
  console.log("\nNext steps:");
  console.log("1. Check your Clay table to see if a new row was created");
  console.log("2. Check if the enrichment actions ran automatically");
  console.log("3. Update the code to use the payload format that worked");
};

testClayWebhook()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });

