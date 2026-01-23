# AI Engine Exchange

A platform for AI engineers to connect, collaborate, and build together.

## Links

- **Vercel:** https://vercel.com/ziwenqwqs-projects/aiengineexchange
- **GitHub:** https://github.com/aiengineorg/aiengineexchange

## Setup

```bash
git clone git@github.com:aiengineorg/aiengineexchange.git
cd aiengineexchange
vercel link --scope ziwenqwqs-projects --project aiengineexchange --yes
vercel env pull
pnpm install
pnpm run dev
```

## Workflow

1. Create your own branch before making changes
2. Make your changes and commit
3. Push and create a pull request
4. If something goes wrong, redeploy on Vercel

## Important Notes

- Be careful with database changes — always test locally first
- Use Drizzle Studio to view and inspect the database
- If you face any issues, try redeploying in Vercel

## Infrastructure

Supabase, Redis, and Blob storage are currently on Keerthan's account. After the hackathon, these will be migrated and linked under the main team account.
