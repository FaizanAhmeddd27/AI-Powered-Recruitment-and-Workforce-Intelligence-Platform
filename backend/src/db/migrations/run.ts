import fs from "fs";
import path from "path";
import { query, connectPostgreSQL, closePostgreSQL } from "../../config/db";
import logger from "../../utils/logger.utils";

const runMigrations = async (): Promise<void> => {
  try {
    logger.info("Starting database migrations...");

    await connectPostgreSQL();

    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter((file) => /^\d+.*\.sql$/i.test(file))
      .sort((a, b) => a.localeCompare(b));

    const has001 = migrationFiles.includes("001_initial_schema.sql");
    if (has001) {
      const hasBaseUsersTable = await query(
        `SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'users'
         LIMIT 1`
      );

      const tracked001 = await query(
        `SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1`,
        ["001_initial_schema.sql"]
      );

      if ((hasBaseUsersTable.rowCount || 0) > 0 && (tracked001.rowCount || 0) === 0) {
        await query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [
          "001_initial_schema.sql",
        ]);
        logger.info(
          "Detected existing base schema. Marked 001_initial_schema.sql as already applied."
        );
      }
    }

    if (migrationFiles.length === 0) {
      logger.info("No migration files found.");
    }

    for (const filename of migrationFiles) {
      const alreadyApplied = await query(
        `SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1`,
        [filename]
      );

      if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
        logger.info(`Skipping already applied migration: ${filename}`);
        continue;
      }

      const sqlPath = path.join(__dirname, filename);
      const sql = fs.readFileSync(sqlPath, "utf-8");

      await query(sql);
      await query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [
        filename,
      ]);

      logger.info(`Migration ${filename} executed successfully`);
    }

    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    logger.info("Tables created:");
    tablesResult.rows.forEach((row: any) => {
      logger.info(`   ├── ${row.table_name}`);
    });

    await closePostgreSQL();
    logger.info("Migrations completed successfully!");
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  }
};

runMigrations();