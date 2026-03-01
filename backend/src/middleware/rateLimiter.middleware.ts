import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";
import { sendError } from "../utils/response.utils";
import logger from "../utils/logger.utils";

interface RateLimitOptions {
  windowMs: number;       
  maxRequests: number;    
  message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, message } = options;
  const windowSeconds = Math.floor(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.user?.userId || req.ip || "anonymous";
      const endpoint = req.originalUrl.split("?")[0]; // Remove query params
      const key = `ratelimit:${identifier}:${endpoint}`;

      const current = await redisClient.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      // Check remaining
      const remaining = Math.max(0, maxRequests - current);
      const ttl = await redisClient.ttl(key);

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", ttl);

      if (current > maxRequests) {
        logger.warn(
          `Rate limit exceeded for ${identifier} on ${endpoint} (${current}/${maxRequests})`
        );
        sendError(
          res,
          429,
          message || "Too many requests. Please try again later."
        );
        return;
      }

      next();
    } catch (error: any) {
      // If Redis fails, allow the request
      logger.error(`❌ Rate limiter error: ${error.message}`);
      next();
    }
  };
};


// Auth endpoints: 5 requests per 15 minutes
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

// Signup: 3 per hour
export const signupLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  message: "Too many signup attempts. Please try again after 1 hour.",
});

// General API: 100 requests per minute
export const apiLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: "Too many requests. Please slow down.",
});

// AI endpoints: 10 per minute (expensive)
export const aiLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "AI processing limit reached. Please wait a minute.",
});

// Resume upload: 5 per hour
export const uploadLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  message: "Upload limit reached. Please try again later.",
});