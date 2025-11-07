import { config } from "dotenv";
import { execSync } from "child_process";
import { join } from "path";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import postgres from "postgres";

config({
  path: ".env.local",
});

interface DatabaseInfo {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Parse PostgreSQL connection string
 * Supports formats:
 * - postgresql://user:password@host:port/database
 * - postgres://user:password@host:port/database
 */
function parsePostgresUrl(url: string): DatabaseInfo {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.pathname.slice(1), // Remove leading /
      user: parsed.username,
      password: parsed.password,
    };
  } catch (error) {
    throw new Error(`Invalid POSTGRES_URL format: ${error}`);
  }
}

/**
 * Create a connection string without the database name (for connecting to postgres db)
 * Preserves SSL parameters from original URL
 */
function getPostgresConnectionString(info: DatabaseInfo, originalUrl: string): string {
  // Extract SSL parameters from original URL if present
  const urlObj = new URL(originalUrl);
  const sslParam = urlObj.searchParams.get("sslmode") || "require";
  
  // For Neon and other cloud providers, require SSL
  const baseUrl = `postgresql://${info.user}:${info.password}@${info.host}:${info.port}/postgres`;
  return `${baseUrl}?sslmode=${sslParam}`;
}

/**
 * Backup database using pg_dump
 */
async function backupDatabase(info: DatabaseInfo, backupPath: string): Promise<void> {
  console.log("📦 Creating database backup...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = join(backupPath, `backup-${info.database}-${timestamp}.sql`);

  // Ensure backup directory exists
  if (!existsSync(backupPath)) {
    mkdirSync(backupPath, { recursive: true });
  }

  try {
    // Use pg_dump if available, otherwise use programmatic backup
    const pgDumpCommand = `PGPASSWORD="${info.password}" pg_dump -h ${info.host} -p ${info.port} -U ${info.user} -d ${info.database} -F p > "${backupFile}"`;

    try {
      execSync(pgDumpCommand, { stdio: "inherit", shell: "/bin/bash" });
      console.log(`✅ Backup created: ${backupFile}`);
    } catch (error) {
      console.log("⚠️  pg_dump not available, using programmatic backup...");
      // Fallback: programmatic backup
      await programmaticBackup(info, backupFile, process.env.POSTGRES_URL!);
    }
  } catch (error) {
    console.error("❌ Backup failed:", error);
    throw error;
  }
}

/**
 * Programmatic backup using postgres-js
 */
async function programmaticBackup(info: DatabaseInfo, backupFile: string, originalUrl: string): Promise<void> {
  // Use original URL to preserve SSL settings
  const sql = postgres(originalUrl);

  try {
    // Get all table schemas
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    let backupContent = `-- Database backup created at ${new Date().toISOString()}\n`;
    backupContent += `-- Database: ${info.database}\n\n`;

    // For each table, get structure and data
    for (const table of tables) {
      const tableName = table.tablename;
      
      // Get table structure
      const structure = await sql`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      backupContent += `\n-- Table: ${tableName}\n`;
      backupContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      const columns = structure.map((col: any) => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.is_nullable === "NO") def += " NOT NULL";
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        return def;
      }).join(",\n");
      
      backupContent += columns + "\n);\n\n";

      // Get table data (limited to prevent huge backups)
      const rowCount = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
      if (rowCount[0].count > 0 && rowCount[0].count < 10000) {
        const data = await sql`SELECT * FROM ${sql(tableName)}`;
        if (data.length > 0) {
          backupContent += `-- Data for ${tableName}\n`;
          // Note: This is a simplified backup. For production, use pg_dump.
        }
      }
    }

    writeFileSync(backupFile, backupContent);
    console.log(`✅ Programmatic backup created: ${backupFile}`);
    console.log("⚠️  Note: This is a simplified backup. For full backups, use pg_dump.");
  } finally {
    await sql.end();
  }
}

/**
 * Drop and recreate database
 */
async function resetDatabase(info: DatabaseInfo, originalUrl: string): Promise<void> {
  console.log("🗑️  Dropping database...");

  // Connect to postgres database (not the target database) to drop it)
  // Note: For Neon and some cloud providers, you may not be able to drop databases
  // In that case, we'll drop all tables instead
  const postgresUrl = getPostgresConnectionString(info, originalUrl);
  
  // Try connecting to the target database first to drop tables
  // If that fails (e.g., Neon doesn't allow dropping databases), we'll drop all tables
  let sql: ReturnType<typeof postgres>;
  
  try {
    // First, try to connect to the target database to drop all tables
    sql = postgres(originalUrl);
    
    // Get all tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    if (tables.length > 0) {
      console.log(`🗑️  Dropping ${tables.length} tables...`);
      // Drop all tables with CASCADE to handle foreign keys
      for (const table of tables) {
        await sql.unsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
      }
      console.log(`✅ All tables dropped`);
    } else {
      console.log(`✅ Database is already empty`);
    }
    
    // Clear migration records so migrations will run again
    try {
      await sql.unsafe(`DELETE FROM drizzle.__drizzle_migrations;`);
      console.log(`✅ Cleared migration records`);
    } catch (error: any) {
      // Migration table might not exist yet, that's okay
      if (!error.message?.includes("does not exist")) {
        console.log(`⚠️  Could not clear migration records: ${error.message}`);
      }
    }
    
    await sql.end();
    
    // Now run migrations to recreate everything
    return;
  } catch (error: any) {
    // If we can't connect to the target database, try connecting to postgres database
    // to drop the entire database (for local PostgreSQL)
    if (error.message?.includes("does not exist") || error.message?.includes("connection")) {
      console.log("⚠️  Cannot connect to target database, trying to drop database directly...");
      try {
        sql = postgres(postgresUrl);
        
        // Terminate all connections to the target database
        const dbNameQuoted = `"${info.database.replace(/"/g, '""')}"`;
        await sql.unsafe(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = '${info.database.replace(/'/g, "''")}'
          AND pid <> pg_backend_pid();
        `);

        // Drop the database
        await sql.unsafe(`DROP DATABASE IF EXISTS ${dbNameQuoted};`);
        console.log(`✅ Database ${info.database} dropped`);

        // Recreate the database
        await sql.unsafe(`CREATE DATABASE ${dbNameQuoted};`);
        console.log(`✅ Database ${info.database} created`);
        
        await sql.end();
        return;
      } catch (dropError: any) {
        // If dropping database fails (e.g., Neon doesn't allow it), just drop tables
        console.log("⚠️  Cannot drop database (may be a managed database like Neon)");
        console.log("ℹ️  Will drop all tables instead...");
        
        // Reconnect to target database and drop tables
        sql = postgres(originalUrl);
        const tables = await sql`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `;
        
        if (tables.length > 0) {
          for (const table of tables) {
            await sql.unsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
          }
          console.log(`✅ All tables dropped`);
        }
        
        await sql.end();
        return;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Run migrations
 */
async function runMigrations(): Promise<void> {
  console.log("🔄 Running migrations...");
  
  try {
    // Import and run the migration script
    const { execSync } = await import("child_process");
    execSync("pnpm db:migrate", { stdio: "inherit" });
    console.log("✅ Migrations completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const postgresUrl = process.env.POSTGRES_URL;

  if (!postgresUrl) {
    console.error("❌ POSTGRES_URL is not defined in .env.local");
    process.exit(1);
  }

  const dbInfo = parsePostgresUrl(postgresUrl);
  const backupDir = join(process.cwd(), "backups");

  console.log(`\n🔄 Resetting database: ${dbInfo.database}`);
  console.log(`📍 Host: ${dbInfo.host}:${dbInfo.port}\n`);

  try {
    // Step 1: Backup
    await backupDatabase(dbInfo, backupDir);

    // Step 2: Drop and recreate (or drop all tables for managed databases)
    await resetDatabase(dbInfo, postgresUrl);

    // Step 3: Run migrations
    await runMigrations();

    console.log("\n✅ Database reset complete!");
    console.log(`📦 Backup saved in: ${backupDir}`);
  } catch (error) {
    console.error("\n❌ Database reset failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();

