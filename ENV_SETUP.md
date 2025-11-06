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

# Discord OAuth (for login)
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Redis for resumable streams (recommended for production)
REDIS_URL=redis://localhost:6379
```

## For Production (Vercel)

Add these environment variables in your Vercel project settings:

1. Go to your project on Vercel
2. Navigate to Settings → Environment Variables
3. Add each variable listed above

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

### Discord OAuth

1. Visit https://discord.com/developers/applications
2. Click "New Application" and give it a name
3. Go to the "OAuth2" section in the left sidebar
4. Copy the "Client ID" and add it as `DISCORD_CLIENT_ID` in your `.env.local`
5. Click "Reset Secret" to generate a client secret, then copy it and add it as `DISCORD_CLIENT_SECRET` in your `.env.local`
6. Under "Redirects", add your callback URL:
   - For local development: `http://localhost:3000/api/auth/callback/discord`
   - For production: `https://yourdomain.com/api/auth/callback/discord`
7. Save changes
