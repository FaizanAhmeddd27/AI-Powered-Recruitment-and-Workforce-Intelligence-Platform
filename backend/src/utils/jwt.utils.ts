import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import env from "../config/env";
import logger from "./logger.utils";


export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface DecodedToken extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenId: string;
  type: "access" | "refresh";
}


export const generateAccessToken = (payload: TokenPayload): string => {
  try {
    const tokenId = uuidv4();

    const options: SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
      issuer: "ai-recruitment-platform",
      audience: "ai-recruitment-users",
      subject: payload.userId,
    };

    const token = jwt.sign(
      {
        ...payload,
        tokenId,
        type: "access",
      },
      env.JWT_ACCESS_SECRET,
      options
    );

    logger.debug(`Access token generated for user: ${payload.userId}`);
    return token;
  } catch (error: any) {
    logger.error(`❌ Access token generation failed: ${error.message}`);
    throw new Error("Token generation failed");
  }
};


export const generateRefreshToken = (payload: TokenPayload): string => {
  try {
    const tokenId = uuidv4();

    const options: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
      issuer: "ai-recruitment-platform",
      audience: "ai-recruitment-users",
      subject: payload.userId,
    };

    const token = jwt.sign(
      {
        ...payload,
        tokenId,
        type: "refresh",
      },
      env.JWT_REFRESH_SECRET,
      options
    );

    logger.debug(`Refresh token generated for user: ${payload.userId}`);
    return token;
  } catch (error: any) {
    logger.error(`❌ Refresh token generation failed: ${error.message}`);
    throw new Error("Token generation failed");
  }
};


export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "ai-recruitment-platform",
      audience: "ai-recruitment-users",
    }) as DecodedToken;

    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      logger.debug("Access token expired");
      throw error;
    }
    logger.error(`❌ Access token verification failed: ${error.message}`);
    throw error;
  }
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: "ai-recruitment-platform",
      audience: "ai-recruitment-users",
    }) as DecodedToken;

    return decoded;
  } catch (error: any) {
    logger.error(`❌ Refresh token verification failed: ${error.message}`);
    throw error;
  }
};


export const generateTokenPair = (
  payload: TokenPayload
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};


export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
};