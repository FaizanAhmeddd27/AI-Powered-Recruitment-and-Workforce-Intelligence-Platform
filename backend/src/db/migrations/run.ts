import fs from "fs";
import path from "path";
import { query, connectPostgreSQL, closePostgreSQL } from "../../config/db";
import logger from "../../utils/logger.utils";

const runMigrations = async (): Promise<void> => {
  try {
    logger.info("Starting database migrations...");

    // Connect to PostgreSQL
    await connectPostgreSQL();

    // Read SQL file
    const sqlPath = path.join(__dirname, "001_initial_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    // Execute migration
    await query(sql);
    logger.info("Migration 001_initial_schema.sql executed successfully");

    // Verify tables created
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

    // Close connection
    await closePostgreSQL();
    logger.info("Migrations completed successfully!");
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  }
};

runMigrations();