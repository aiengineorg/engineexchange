# Testing Clay Webhook Locally

## Option 1: Use ngrok (Recommended)

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your Next.js dev server:**
   ```bash
   pnpm dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL ngrok gives you:**
   - Example: `https://abc123.ngrok.io`
   - This is your public URL that Clay can reach

5. **Use this URL in Clay:**
   - `https://abc123.ngrok.io/api/clay-callback`

## Option 2: Use localtunnel (Free alternative)

1. **Install localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your Next.js dev server:**
   ```bash
   pnpm dev
   ```

3. **In another terminal, start localtunnel:**
   ```bash
   lt --port 3000
   ```

4. **Use the URL it gives you in Clay**

## Option 3: Deploy to Vercel Preview

1. Push your code to GitHub
2. Vercel will create a preview deployment
3. Use the preview URL in Clay: `https://your-preview-url.vercel.app/api/clay-callback`

## Testing the Webhook

You can test if your webhook is working by sending a test request:

```bash
curl -X POST http://localhost:3000/api/clay-callback \
  -H "Content-Type: application/json" \
  -d '{
    "linkedin_url": "https://www.linkedin.com/in/keerthanen-ravichandran/",
    "summary": "Test summary from Clay"
  }'
```

Or use the test script:
```bash
npx tsx scripts/test-clay-callback.ts
```

