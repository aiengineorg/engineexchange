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

# Optional: Redis for resumable streams
# REDIS_URL=your_redis_url_here
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
