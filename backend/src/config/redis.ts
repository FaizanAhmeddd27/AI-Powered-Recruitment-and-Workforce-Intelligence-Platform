import { Redis } from "@upstash/redis";
import IORedis from "ioredis";
import env from "./env";
import logger from "../utils/logger.utils";


export const redisRest = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});


export const redisClient = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) {
      logger.error("❌ Redis retry limit reached");
      return null;
    }
    const delay = Math.min(times * 200, 2000);
    logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  tls: {
    rejectUnauthorized: false,
  },
});


redisClient.on("connect", () => {
  logger.debug("IORedis client connecting...");
});

redisClient.on("ready", () => {
  logger.info("IORedis client ready");
});

redisClient.on("error", (err: Error) => {
  logger.error(`❌ IORedis error: ${err.message}`);
});

redisClient.on("close", () => {
  logger.warn("IORedis connection closed");
});


export const setCache = async (
  key: string,
  value: any,
  expiryInSeconds: number = 3600
): Promise<void> => {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, expiryInSeconds, serialized);
    logger.debug(`Cache SET: ${key} (TTL: ${expiryInSeconds}s)`);
  } catch (error: any) {
    logger.error(`❌ Cache SET failed for ${key}: ${error.message}`);
  }
};


export const getCache = async <T = any>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(data) as T;
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (error: any) {
    logger.error(`❌ Cache GET failed for ${key}: ${error.message}`);
    return null;
  }
};


export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
    logger.debug(`Cache DELETE: ${key}`);
  } catch (error: any) {
    logger.error(`❌ Cache DELETE failed for ${key}: ${error.message}`);
  }
};


export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug(`Cache PATTERN DELETE: ${pattern} (${keys.length} keys)`);
    }
  } catch (error: any) {
    logger.error(
      `❌ Cache PATTERN DELETE failed for ${pattern}: ${error.message}`
    );
  }
};


export const incrementCache = async (key: string): Promise<number> => {
  try {
    const result = await redisClient.incr(key);
    return result;
  } catch (error: any) {
    logger.error(`❌ Cache INCR failed for ${key}: ${error.message}`);
    return 0;
  }
};


export const pushToQueue = async (
  queueName: string,
  data: any
): Promise<void> => {
  try {
    await redisClient.lpush(queueName, JSON.stringify(data));
    logger.debug(`Queue PUSH: ${queueName}`);
  } catch (error: any) {
    logger.error(`❌ Queue PUSH failed for ${queueName}: ${error.message}`);
  }
};


export const popFromQueue = async <T = any>(
  queueName: string
): Promise<T | null> => {
  try {
    const data = await redisClient.rpop(queueName);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (error: any) {
    logger.error(`❌ Queue POP failed for ${queueName}: ${error.message}`);
    return null;
  }
};


export const connectRedis = async (): Promise<void> => {
  try {
    // Test REST client
    await redisRest.set("test:connection", "alive");
    const testValue = await redisRest.get("test:connection");
    if (testValue === "alive") {
      logger.info("Upstash Redis REST client connected successfully");
      await redisRest.del("test:connection");
    }

    // Test IORedis client
    const pong = await redisClient.ping();
    if (pong === "PONG") {
      logger.info("IORedis client connected successfully");
    }
  } catch (error: any) {
    logger.error(`❌ Redis connection failed: ${error.message}`);
    throw error;
  }
};


export const closeRedis = async (): Promise<void> => {
  await redisClient.quit();
  logger.info("Redis connection closed");
};