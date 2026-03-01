import app from "./app";
import env from "./config/env";
import logger from "./utils/logger.utils";
import { connectPostgreSQL, closePostgreSQL } from "./config/db";
import { connectMongoDB, closeMongoDB } from "./config/mongodb";
import { connectRedis, closeRedis } from "./config/redis";
import { testGroqConnection } from "./config/groq";
import { startResumeWorker, stopResumeWorker } from "./workers/resumeProcessor.worker";

const startServer = async (): Promise<void> => {
  try {
    logger.info("Connecting to PostgreSQL (Neon)...");
    await connectPostgreSQL();

    logger.info("Connecting to MongoDB Atlas...");
    await connectMongoDB();

    logger.info("Connecting to Redis (Upstash)...");
    await connectRedis();

    logger.info("Testing GROQ AI connection...");
    await testGroqConnection();

    logger.info("Starting background workers...");
    startResumeWorker();

    const server = app.listen(env.PORT, () => {
      logger.info("-----------------------------------------");
      logger.info(`Server running on http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
      logger.info("-----------------------------------------");
      logger.info("PostgreSQL - Connected (Neon)");
      logger.info("MongoDB - Connected (Atlas)");
      logger.info("Redis - Connected (Upstash)");
      logger.info("GROQ AI - Ready (Llama 3.1 70B)");
      logger.info("Workers - Resume processor running");
      logger.info("-----------------------------------------");
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      stopResumeWorker();

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await closePostgreSQL();
          await closeMongoDB();
          await closeRedis();
          logger.info("All connections closed. Goodbye!");
          process.exit(0);
        } catch (error) {
          logger.error(`Error during shutdown: ${error}`);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason: any) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

startServer();