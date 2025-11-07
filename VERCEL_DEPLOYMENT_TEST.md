# Testing Database Migrations on Vercel

## Overview

This guide helps you test that database migrations work correctly when deploying to Vercel from a clean database state.

## Current Setup

✅ **Migrations are configured correctly:**
- All 14 migrations are tracked in `lib/db/migrations/meta/_journal.json`
- Build script runs migrations: `"build": "tsx lib/db/migrate && next build"`
- Migration 0013 (discord_id) is now included

## Testing Steps

### Option 1: Test with Preview Deployment (Recommended)

1. **Ensure your preview database is separate from production**
   - In Vercel → Settings → Environment Variables
   - Set `POSTGRES_URL` for Preview environment to a test database
   - This should be a different database than production

2. **Reset the preview database** (if you have access):
   ```bash
   # Connect to preview database and drop all tables
   # Or use your database provider's UI to reset
   ```

3. **Deploy to preview:**
   ```bash
   git push origin your-branch
   ```
   - Vercel will automatically create a preview deployment
   - The build process will run migrations automatically

4. **Check build logs:**
   - Go to Vercel Dashboard → Your Deployment → Build Logs
   - Look for: `⏳ Running migrations...` and `✅ Migrations completed`
   - Verify no errors occurred

5. **Test the application:**
   - Try Discord OAuth login
   - Verify it works (should create user with discord_id)

### Option 2: Test with Production (Use with Caution)

⚠️ **Warning:** Only do this if you have a backup and are okay with losing production data temporarily.

1. **Backup production database first!**

2. **Reset production database:**
   - Use your database provider's UI or CLI
   - Drop all tables or reset the database

3. **Deploy to production:**
   ```bash
   git push origin main  # or your production branch
   ```

4. **Monitor the deployment:**
   - Watch build logs for migration success
   - Test the application immediately after deployment

### Option 3: Test Locally (Already Done)

We've already tested locally with `pnpm db:reset` and verified:
- ✅ All 14 migrations run successfully
- ✅ All 6 tables are created
- ✅ `discord_id` column exists in User table
- ✅ Migration records are properly tracked

## What to Look For in Vercel Build Logs

### Success Indicators:
```
⏳ Running migrations...
✅ Migrations completed in XXX ms
```

### Failure Indicators:
```
❌ Migration failed
relation "User" does not exist
```

## Troubleshooting

### If migrations fail in Vercel:

1. **Check environment variables:**
   - Ensure `POSTGRES_URL` is set correctly
   - Verify it's set for the right environment (Preview/Production)

2. **Check build logs:**
   - Look for specific error messages
   - Verify migrations are running (check for migration output)

3. **Verify migration files:**
   - Ensure all migration files are committed to git
   - Check that `_journal.json` includes all migrations

4. **Database connection:**
   - Verify database is accessible from Vercel
   - Check firewall/network settings
   - Ensure SSL is enabled if required

## Current Migration Status

All migrations are properly configured:
- ✅ 0000-0012: Tracked and working
- ✅ 0013: Now added to journal (discord_id column)
- ✅ Total: 14 migrations

## Next Steps

1. **Commit the changes:**
   ```bash
   git add lib/db/migrations/meta/_journal.json
   git commit -m "Add migration 0013 to journal for discord_id column"
   git push
   ```

2. **Deploy to preview:**
   - Push to a feature branch
   - Vercel will create a preview deployment
   - Migrations will run automatically

3. **Verify in preview:**
   - Check build logs
   - Test Discord OAuth
   - Verify database schema

4. **Deploy to production:**
   - Once verified in preview
   - Merge to main/production branch
   - Monitor deployment

## Important Notes

- **Migrations run automatically** on every build (configured in `package.json`)
- **Build fails if migrations fail** - this prevents deploying broken schema
- **Preview and Production** should use separate databases for safety
- **Always backup** before resetting production database

