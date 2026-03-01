import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractTokenFromHeader, DecodedToken } from "../utils/jwt.utils";
import { getCache } from "../config/redis";
import { sendError } from "../utils/response.utils";
import logger from "../utils/logger.utils";


declare module "express-serve-static-core" {
  interface Request {
    user?: DecodedToken;
  }
}


export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      sendError(res, 401, "Authentication required. Please provide a valid token.");
      return;
    }

    // 2. Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = verifyAccessToken(token);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        sendError(res, 401, "Token expired. Please refresh your token.");
        return;
      }
      sendError(res, 401, "Invalid token.");
      return;
    }

    // 3. Check if session exists in Redis
    const sessionKey = `session:${decoded.userId}`;
    const sessionData = await getCache<{ isActive: boolean }>(sessionKey);

    if (!sessionData || !sessionData.isActive) {
      logger.warn(`No active session found for user: ${decoded.userId}`);
      sendError(res, 401, "Session expired. Please login again.");
      return;
    }

    // 4. Attach user to request
    req.user = decoded;

    logger.debug(`Authenticated user: ${decoded.userId} (${decoded.role})`);
    next();
  } catch (error: any) {
    logger.error(`❌ Authentication error: ${error.message}`);
    sendError(res, 500, "Authentication failed");
  }
};


export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      const sessionKey = `session:${decoded.userId}`;
      const sessionData = await getCache<{ isActive: boolean }>(sessionKey);

      if (sessionData && sessionData.isActive) {
        req.user = decoded;
      }
    } catch {
      // Token invalid — don't block, just continue without user
    }

    next();
  } catch {
    next();
  }
};