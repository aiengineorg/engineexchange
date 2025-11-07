/**
 * Clay API integration for enriching user profiles with LinkedIn data
 * 
 * Clay provides person enrichment capabilities through their API.
 * This service handles enriching profiles with LinkedIn information.
 */

interface ClayEnrichmentRequest {
  linkedinUrl?: string;
  linkedinUserId?: string;
  email?: string;
  name?: string;
  company?: string;
}

interface ClayEnrichmentResponse {
  success: boolean;
  data?: {
    fullName?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    linkedinUrl?: string;
    linkedinSummary?: string;
    linkedinConnections?: number;
    linkedinFollowers?: number;
    profileImage?: string;
    [key: string]: unknown;
  };
  error?: string;
}

/**
 * Enriches a person's profile using Clay API
 * 
 * @param request - Enrichment request with LinkedIn URL, email, name, or company
 * @returns Enriched profile data or error
 */
export async function enrichPersonWithClay(
  request: ClayEnrichmentRequest
): Promise<ClayEnrichmentResponse> {
  const apiKey = process.env.CLAY_API_KEY;
  
  if (!apiKey) {
    console.warn("CLAY_API_KEY not set, skipping enrichment");
    return {
      success: false,
      error: "Clay API key not configured",
    };
  }

  // Clay webhook endpoint
  // This is the webhook URL from your Clay table's HTTP API column
  // Format: https://api.clay.com/v3/sources/webhook/{webhook-id}
  const webhookUrl = process.env.CLAY_WEBHOOK_URL || process.env.CLAY_API_URL;
  
  if (!webhookUrl) {
    console.error("CLAY_WEBHOOK_URL or CLAY_API_URL not set. Please configure it in your .env.local file.");
    return {
      success: false,
      error: "Clay webhook URL not configured. Please set CLAY_WEBHOOK_URL in your environment variables.",
    };
  }
  
  try {
    // Clay webhooks accept data in the request body
    // Based on testing, Clay expects: linkedin_url (with underscore)
    const payload: Record<string, unknown> = {};
    
    // Add LinkedIn URL if provided (Clay expects linkedin_url with underscore)
    if (request.linkedinUrl) {
      payload.linkedin_url = request.linkedinUrl;
    }
    
    // Add other fields if available
    if (request.name) {
      payload.name = request.name;
    }
    if (request.email) {
      payload.email = request.email;
    }
    if (request.company) {
      payload.company = request.company;
    }
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Clay webhooks may or may not require API key in header
        // If your webhook requires auth, uncomment the line below
        ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unable to read error response";
      }
      
      console.error("Clay webhook error:", {
        status: response.status,
        statusText: response.statusText,
        url: webhookUrl,
        body: errorText,
      });
      
      // If 404, provide helpful guidance
      if (response.status === 404) {
        return {
          success: false,
          error: `Clay webhook endpoint not found (404). Please check:\n1. Your CLAY_WEBHOOK_URL environment variable\n2. That the webhook URL is correct\n3. That the webhook is active in your Clay workspace\n\nCurrent URL: ${webhookUrl}`,
        };
      }
      
      return {
        success: false,
        error: `Clay API error: ${response.status} ${response.statusText}. ${errorText}`,
      };
    }

    // Clay webhooks may return data immediately or just acknowledge receipt
    // If it returns data, use it; otherwise we'll need to poll or use a different approach
    let responseData: unknown;
    try {
      const responseText = await response.text();
      if (responseText) {
        responseData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.warn("Clay webhook response may not be JSON, or webhook only acknowledges receipt:", parseError);
      // Webhooks often just return 200 OK without data
      // The enrichment might happen asynchronously in Clay
      // For now, we'll return a success but note that data might not be immediately available
      return {
        success: true,
        data: {
          // Return basic info since we can't get enriched data immediately from webhook
          linkedinUrl: request.linkedinUrl,
          note: "Data sent to Clay webhook. Enrichment may be processed asynchronously.",
        },
      };
    }
    
    // If we got data back, try to map it to our expected format
    const data = responseData as Record<string, unknown>;
    
    // Map common Clay response fields to our expected format
    const mappedData: ClayEnrichmentResponse["data"] = {
      linkedinUrl: (data.linkedin_url || data.linkedinUrl || data.linkedInUrl || request.linkedinUrl) as string | undefined,
      fullName: (data.full_name || data.fullName || data.name) as string | undefined,
      jobTitle: (data.job_title || data.jobTitle || data.title) as string | undefined,
      company: data.company as string | undefined,
      location: data.location as string | undefined,
      linkedinSummary: (data.linkedin_summary || data.linkedinSummary || data.summary) as string | undefined,
      linkedinConnections: (data.linkedin_connections || data.linkedinConnections) as number | undefined,
      linkedinFollowers: (data.linkedin_followers || data.linkedinFollowers) as number | undefined,
      profileImage: (data.profile_image || data.profileImage) as string | undefined,
      // Include any other fields from the response
      ...data,
    };
    
    return {
      success: true,
      data: mappedData,
    };
  } catch (error) {
    console.error("Failed to enrich person with Clay:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generates a summary from enriched LinkedIn data
 * 
 * @param enrichmentData - Enriched data from Clay
 * @returns A formatted summary string
 */
export function generateLinkedInSummary(
  enrichmentData: ClayEnrichmentResponse["data"]
): string {
  if (!enrichmentData) {
    return "";
  }

  const parts: string[] = [];

  if (enrichmentData.fullName) {
    parts.push(`Name: ${enrichmentData.fullName}`);
  }

  if (enrichmentData.jobTitle) {
    const jobInfo = enrichmentData.company
      ? `${enrichmentData.jobTitle} at ${enrichmentData.company}`
      : enrichmentData.jobTitle;
    parts.push(`Role: ${jobInfo}`);
  }

  if (enrichmentData.location) {
    parts.push(`Location: ${enrichmentData.location}`);
  }

  if (enrichmentData.linkedinSummary) {
    parts.push(`Summary: ${enrichmentData.linkedinSummary}`);
  }

  if (enrichmentData.linkedinConnections) {
    parts.push(`Connections: ${enrichmentData.linkedinConnections.toLocaleString()}`);
  }

  if (enrichmentData.linkedinFollowers) {
    parts.push(`Followers: ${enrichmentData.linkedinFollowers.toLocaleString()}`);
  }

  return parts.join("\n");
}

