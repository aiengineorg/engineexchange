# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Brave Search API Key
# Get your API key from: https://brave.com/search/api/
BRAVE_API_KEY=BSAQQXhVv0qkfnpKB_Zu0TQBTSZaJ1X

# OpenAI API Key (or other LLM provider)
OPENAI_API_KEY=your_openai_api_key_here

# Database (if using)
POSTGRES_URL=your_postgres_connection_string

# Auth Secret
AUTH_SECRET=your_auth_secret_here

# Auth URL (optional - NextAuth v5 auto-detects from request, but set explicitly for production if needed)
# AUTH_URL=https://your-domain.vercel.app

# Discord OAuth (for login)
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Base URL for OAuth callbacks (required for Vercel deployments)
# For production: Set this to your production domain (e.g., https://yourdomain.com)
# For preview deployments: Either set this to production URL OR add preview URLs to Discord
AUTH_URL=https://yourdomain.com

# Redis for resumable streams (recommended for production)
REDIS_URL=redis://localhost:6379

# Clay Webhook URL (for LinkedIn profile enrichment)
# Get this from your Clay table: Add an "HTTP API" column to get the webhook URL
# Format: https://api.clay.com/v3/sources/webhook/{webhook-id}
CLAY_WEBHOOK_URL=https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-7b96cf74-29df-4e88-a128-dbb700c3b031

# Clay API Key (optional - only needed if your webhook requires authentication)
# Get your API key from: https://app.clay.com/settings/api-keys
# CLAY_API_KEY=your_clay_api_key_here
```

## For Production (Vercel)

Add these environment variables in your Vercel project settings:

1. Go to your project on Vercel
2. Navigate to Settings → Environment Variables
3. Add each variable listed above

**Required for Discord OAuth:**
- `DISCORD_CLIENT_ID` - Your Discord application Client ID
- `DISCORD_CLIENT_SECRET` - Your Discord application Client Secret
- `AUTH_SECRET` - Your NextAuth secret (generate with: `openssl rand -base64 32`)
- `AUTH_URL` (optional but recommended for production) - Your production URL (e.g., `https://ai-chatbot-vercel-tau-sage.vercel.app`)

**Important:** Make sure to add these to the **Production** environment (and optionally Preview/Development if you want to test there too).

**Note:** If you're getting "Invalid URL" errors, set `AUTH_URL` to your exact production domain (without trailing slash).

## Getting API Keys

### Brave Search API

1. Visit https://brave.com/search/api/
2. Sign up for an account
3. Copy your API key
4. Add it as `BRAVE_API_KEY` in your `.env.local`

### OpenAI API

1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add it as `OPENAI_API_KEY` in your `.env.local`

### Clay API (for LinkedIn Enrichment)

1. **Get your API key:**
   - Visit https://app.clay.com/settings/api-keys
   - Sign in to your Clay account
   - Create a new API key or use an existing one
   - Add it as `CLAY_API_KEY` in your `.env.local`

2. **Get your webhook URL:**
   - In your Clay table, add an "HTTP API" column (if you haven't already)
   - Copy the webhook URL that Clay provides
   - Format: `https://api.clay.com/v3/sources/webhook/{webhook-id}`
   - Add it as `CLAY_WEBHOOK_URL` in your `.env.local`
   - Example: `CLAY_WEBHOOK_URL=https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-7b96cf74-29df-4e88-a128-dbb700c3b031`

3. **Note:** Clay enrichment is optional - profiles can be created without it. The enrichment will automatically run when a LinkedIn URL is provided during profile creation or update.

4. **Troubleshooting 404 errors:**
   - Make sure `CLAY_API_URL` is set correctly
   - Verify the endpoint format matches Clay's current API structure
   - Check that your API key has the necessary permissions
   - Review Clay's API documentation for any recent changes

### Discord OAuth

1. Visit https://discord.com/developers/applications
2. Click "New Application" and give it a name
3. Go to the "OAuth2" section in the left sidebar
4. Copy the "Client ID" and add it as `DISCORD_CLIENT_ID` in your `.env.local`
5. Click "Reset Secret" to generate a client secret, then copy it and add it as `DISCORD_CLIENT_SECRET` in your `.env.local`
   - **Important**: Copy the secret immediately - you won't be able to see it again!
6. Under "Redirects", add your callback URLs:
   - For local development: `http://localhost:3000/api/auth/callback/discord`
   - For production: Use your actual production domain (e.g., `https://your-domain.vercel.app/api/auth/callback/discord`)
   - **Critical**: The redirect URI must match **exactly** (including protocol, domain, and path)
   - To find your production URL: Check your Vercel deployment settings or use your custom domain
7. Save changes

#### Vercel Deployment Configuration

**For Production:**
1. In Vercel project settings → Environment Variables, add:
   - `AUTH_URL` = `https://your-production-domain.com` (your actual production domain, no trailing slash)
   - `DISCORD_CLIENT_ID` = (your Discord client ID)
   - `DISCORD_CLIENT_SECRET` = (your Discord client secret)
2. In Discord app settings, add the production callback URL:
   - `https://your-production-domain.com/api/auth/callback/discord`

**For Preview/UAT Deployments (Vercel Preview URLs):**
Vercel generates unique preview URLs for each deployment (e.g., `https://project-abc123.vercel.app`). With `trustHost: true` in NextAuth, the redirect URI is automatically detected from the request URL. However, Discord requires exact redirect URI matches, so you need to add preview URLs to Discord.

**Recommended Approach: Add Preview URLs to Discord**
1. **Find your preview URL:**
   - After deploying to Vercel, check the deployment URL (e.g., `https://ai-chatbot-vercel-git-feature-branch-username.vercel.app`)
   - Or use: `https://${VERCEL_URL}` from your deployment logs

2. **Add to Discord:**
   - Go to Discord Developer Portal → Your App → OAuth2 → Redirects
   - Add: `https://your-preview-url.vercel.app/api/auth/callback/discord`
   - Repeat for each preview deployment you want to support
   - **Tip:** You can add multiple redirect URIs in Discord

3. **For Stable UAT Environment:**
   - If you have a stable UAT/preview domain (e.g., `https://uat.yourdomain.com`), add that instead
   - Set `AUTH_URL` in Vercel Preview environment to your UAT domain
   - Add the UAT callback URL to Discord: `https://uat.yourdomain.com/api/auth/callback/discord`

**Alternative: Use Production URL for OAuth (Simpler but less ideal)**
- Set `AUTH_URL` in Vercel Preview environment to your production domain
- All deployments (preview and production) will use the same OAuth callback
- Users authenticate via production, then return to the preview URL
- **Note:** This works but means preview deployments share OAuth state with production

#### Troubleshooting Discord OAuth Errors

If you encounter an `invalid_client` error:

1. **Verify Redirect URI Match:**
   - Check your Discord app's OAuth2 redirect URIs match your actual callback URL exactly
   - The callback URL format is: `https://your-domain.com/api/auth/callback/discord`
   - Ensure there are no trailing slashes or typos

2. **Verify Environment Variables:**
   - In Vercel: Go to Settings → Environment Variables
   - Ensure `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are set for Production
   - Make sure there are no extra spaces or quotes around the values
   - If you reset the secret in Discord, update it in Vercel immediately

3. **Check Client Secret:**
   - If you reset the secret in Discord, you must update it in Vercel
   - Old secrets become invalid immediately after reset
   - Copy the new secret exactly (no extra spaces)

4. **Verify Production URL:**
   - Check your Vercel deployment to confirm the actual production URL
   - If using a custom domain, ensure it's properly configured
   - Add both your Vercel deployment URL and custom domain to Discord redirects if needed

5. **Fix "Invalid URL" or "redirect_uri mismatch" Errors:**
   - Set the `AUTH_URL` environment variable in Vercel to your production URL
   - Format: `AUTH_URL=https://your-domain.vercel.app` (use your actual domain)
   - No trailing slash, include `https://` protocol
   - **Important:** Set this for Production, Preview, AND Development environments in Vercel
   - This ensures NextAuth uses the correct base URL for OAuth callbacks
   - Verify the URL in Discord's redirect URIs matches exactly: `https://your-domain.vercel.app/api/auth/callback/discord`

6. **Preview/UAT Deployment Issues:**
   - **With `trustHost: true`**, NextAuth automatically detects the URL from request headers
   - The preview URL must be added to Discord's redirect URIs
   - Format: `https://your-preview-url.vercel.app/api/auth/callback/discord`
   - **To find your preview URL:**
     - Check Vercel deployment page for the exact URL
     - Or check the `VERCEL_URL` environment variable in deployment logs
   - **For stable UAT:** Use a custom domain for preview (e.g., `uat.yourdomain.com`) and add that to Discord
   - **Quick test:** After adding a preview URL to Discord, wait a few seconds for changes to propagate, then try OAuth again
