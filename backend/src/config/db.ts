import { Pool, QueryResult, QueryResultRow } from "pg";
import env from "./env";
import logger from "../utils/logger.utils";


const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,                    // Maximum connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Timeout after 10s if can't connect
});


pool.on("connect", () => {
  logger.debug("New PostgreSQL client connected from pool");
});

pool.on("error", (err: Error) => {
  logger.error(`❌ PostgreSQL pool error: ${err.message}`);
  process.exit(-1);
});


export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug(
      `SQL Query executed in ${duration}ms | Rows: ${result.rowCount} | Query: ${text.substring(0, 80)}...`
    );
    return result;
  } catch (error: any) {
    logger.error(`❌ SQL Query failed: ${error.message} | Query: ${text.substring(0, 100)}`);
    throw error;
  }
};

export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    logger.debug("Transaction committed successfully");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`❌ Transaction rolled back: ${error}`);
    throw error;
  } finally {
    client.release();
  }
};


export const queryOne = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> => {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
};


export const queryMany = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const result = await query<T>(text, params);
  return result.rows;
};


export const connectPostgreSQL = async (): Promise<void> => {
  try {
    const result = await query("SELECT NOW() as current_time, version()");
    logger.info(
      `PostgreSQL connected successfully | Time: ${result.rows[0].current_time}`
    );
  } catch (error: any) {
    logger.error(`❌ PostgreSQL connection failed: ${error.message}`);
    throw error;
  }
};

export const closePostgreSQL = async (): Promise<void> => {
  await pool.end();
  logger.info("PostgreSQL pool closed");
};

export default pool;