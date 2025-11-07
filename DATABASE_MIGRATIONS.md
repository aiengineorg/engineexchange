# Database Migrations Guide

## Overview

Database migrations are automatically run during the build process for all deployments (production, preview, and development). This ensures your database schema stays in sync with your code.

## How Migrations Work

1. **Build Process**: The `build` script in `package.json` runs migrations before building:
   ```json
   "build": "tsx lib/db/migrate && next build"
   ```

2. **Migration Execution**: Migrations run automatically during Vercel deployments using the `POSTGRES_URL` environment variable for that environment.

3. **Migration Safety**: Drizzle tracks which migrations have been applied, so running migrations multiple times is safe (idempotent).

## Environment Setup

### Production Environment

**Required:**
- `POSTGRES_URL` - Your production database connection string
- Set in Vercel: Settings → Environment Variables → Production

**Migration Behavior:**
- Migrations run automatically on every production deployment
- Only new/unapplied migrations will execute
- Production database should be backed up regularly

### Preview/UAT Environment

**Required:**
- `POSTGRES_URL` - Your preview/UAT database connection string
- Set in Vercel: Settings → Environment Variables → Preview

**Important Decision: Separate Database vs Shared Database**

#### Option 1: Separate Database for Preview/UAT (Recommended)

**Pros:**
- Preview deployments won't affect production data
- Safe to test migrations and data changes
- Can reset/seed preview database without risk

**Cons:**
- Additional database cost
- Need to manage two databases

**Setup:**
1. Create a separate database for preview/UAT
2. Set `POSTGRES_URL` in Vercel Preview environment to the preview database
3. Migrations will run automatically on preview deployments
4. Preview database will have the same schema as production

#### Option 2: Shared Database (Not Recommended for Production)

**Pros:**
- Single database to manage
- Lower cost

**Cons:**
- Preview deployments can affect production data
- Risk of data corruption or accidental changes
- Cannot test destructive migrations safely

**Setup:**
1. Use the same `POSTGRES_URL` for both Production and Preview
2. ⚠️ **Warning**: This is risky and not recommended for production apps

## Migration Workflow

### 1. Create a New Migration

```bash
# Generate migration from schema changes
pnpm db:generate

# This creates a new file in lib/db/migrations/
```

### 2. Review the Migration

- Check the generated SQL file in `lib/db/migrations/`
- Verify the changes are correct
- Test locally first: `pnpm db:migrate`

### 3. Deploy to Preview/UAT First

1. Push your code (including the new migration file)
2. Vercel will automatically:
   - Run the migration on preview database
   - Build the application
   - Deploy to preview URL
3. Test your changes in preview environment
4. Verify the migration was applied correctly

### 4. Deploy to Production

1. Once preview is tested and verified
2. Merge to production branch
3. Vercel will automatically:
   - Run the migration on production database
   - Build the application
   - Deploy to production

## Checking Migration Status

### Local Development

```bash
# Check which migrations have been applied
pnpm db:check

# View database in Drizzle Studio
pnpm db:studio
```

### In Production/Preview

- Check Vercel build logs for migration output
- Look for: `⏳ Running migrations...` and `✅ Migrations completed`
- If migrations fail, the build will fail (preventing deployment)

## Troubleshooting

### Migration Fails During Build

**Symptoms:**
- Build fails with migration errors
- Deployment doesn't complete

**Solutions:**
1. Check the migration SQL for syntax errors
2. Verify `POSTGRES_URL` is set correctly in Vercel
3. Check database connection (firewall, credentials)
4. Review Vercel build logs for specific error

### Migration Already Applied Error

**Symptoms:**
- Error about migration already existing

**Solutions:**
- This is usually safe to ignore (migrations are idempotent)
- If it's a real issue, check the `drizzle.__drizzle_migrations` table

### Preview Database Out of Sync

**Symptoms:**
- Preview environment has different schema than production

**Solutions:**
1. Ensure `POSTGRES_URL` is set for Preview environment
2. Trigger a new preview deployment (migrations will run)
3. Or manually run: `pnpm db:migrate` against preview database

## Best Practices

1. **Always test migrations in preview first** before production
2. **Use separate databases** for production and preview
3. **Backup production database** before major migrations
4. **Review generated migrations** before committing
5. **Never modify existing migration files** - create new ones instead
6. **Keep migrations small and focused** - one logical change per migration
7. **Test rollback procedures** for critical migrations

## Migration Files

All migration files are in `lib/db/migrations/`:
- Format: `XXXX_description.sql`
- Migrations are tracked in `drizzle.__drizzle_migrations` table
- Never delete migration files (they're part of your version history)

## Reset Database (Backup, Drop, Recreate)

To test migrations from scratch, you can reset your local database:

```bash
# This will:
# 1. Backup your database to ./backups/
# 2. Drop the database
# 3. Recreate it
# 4. Run all migrations from scratch
pnpm db:reset
```

**What it does:**
- Creates a timestamped backup in `./backups/` directory
- Safely drops your local database
- Recreates an empty database
- Runs all migrations in order

**Requirements:**
- `POSTGRES_URL` must be set in `.env.local`
- You need permissions to drop/create databases
- If `pg_dump` is available, it will be used for backup (better quality)
- Otherwise, a simplified programmatic backup is created

**Warning:** This will **delete all data** in your local database. The backup is created first, but make sure you're working with a local/test database, not production!

## Manual Migration (If Needed)

If you need to run migrations manually:

```bash
# Set POSTGRES_URL environment variable
export POSTGRES_URL="your-connection-string"

# Run migrations
pnpm db:migrate
```

Or use the script directly:
```bash
npx tsx lib/db/migrate.ts
```

## Environment Variables Summary

| Environment | POSTGRES_URL | Migration Behavior |
|------------|--------------|-------------------|
| Local Dev | `.env.local` | Run manually: `pnpm db:migrate` |
| Preview/UAT | Vercel Preview env var | Runs automatically on build |
| Production | Vercel Production env var | Runs automatically on build |

## Important Notes

- ⚠️ **Migrations run automatically on every deployment** - ensure your migration files are safe to run multiple times
- ⚠️ **Preview and Production should use separate databases** for safety
- ✅ **Migrations are idempotent** - safe to run multiple times
- ✅ **Build fails if migrations fail** - prevents deploying broken schema

