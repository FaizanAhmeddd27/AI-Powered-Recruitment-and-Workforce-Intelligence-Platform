import { v4 as uuidv4 } from "uuid";
import { query, queryOne, transaction } from "../config/db";
import { setCache, deleteCache, getCache } from "../config/redis";
import { UserQueries } from "../db/queries/user.queries";
import { hashPassword, comparePassword } from "../utils/password.utils";
import {
  generateTokenPair,
  verifyRefreshToken,
  TokenPayload,
} from "../utils/jwt.utils";
import { AppError } from "../middleware/error.middleware";
import { IUser, IUserPublic, AuthProvider } from "../models/types/user.types";
import logger from "../utils/logger.utils";

// ============================================
// Session duration constants
// ============================================
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// ============================================
// SIGNUP - Local
// ============================================
export const signupLocal = async (data: {
  email: string;
  password: string;
  full_name: string;
  role: string;
}): Promise<{
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
}> => {
  // 1. Check if email already exists
  const existingUser = await queryOne<IUser>(UserQueries.findByEmail, [data.email]);

  if (existingUser) {
    throw new AppError("Email already registered. Please login instead.", 409);
  }

  // 2. Hash password
  const passwordHash = await hashPassword(data.password);

  // 3. Create user in PostgreSQL (transaction)
  const result = await transaction(async (client) => {
    // Insert user
    const userResult = await client.query(UserQueries.createUser, [
      data.email,
      passwordHash,
      data.full_name,
      data.role,
      "local",
      null,
      null,
    ]);

    const newUser = userResult.rows[0];

    // If candidate, create candidate_profiles entry
    if (data.role === "candidate") {
      await client.query(UserQueries.createCandidateProfile, [newUser.id]);
    }

    // Log activity
    await client.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        newUser.id,
        "user_signup",
        "user",
        newUser.id,
        JSON.stringify({ method: "local", role: data.role }),
      ]
    );

    return newUser;
  });

  // 4. Generate JWT tokens
  const tokenPayload: TokenPayload = {
    userId: result.id,
    email: result.email,
    role: result.role,
  };

  const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

  // 5. Store session in Redis
  await setCache(
    `session:${result.id}`,
    {
      userId: result.id,
      email: result.email,
      role: result.role,
      isActive: true,
      loginAt: new Date().toISOString(),
      method: "local",
    },
    SESSION_EXPIRY
  );

  // 6. Store refresh token hash in PostgreSQL
  const tokenHash = Buffer.from(refreshToken).toString("base64").substring(0, 255);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [result.id, tokenHash]
  );

  logger.info(`✅ New user registered: ${result.email} (${result.role})`);

  // 7. Return user (without sensitive data)
  const publicUser: IUserPublic = {
    id: result.id,
    email: result.email,
    full_name: result.full_name,
    role: result.role,
    avatar_url: result.avatar_url,
    phone: null,
    location: null,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    bio: null,
    profile_completion: result.profile_completion,
    created_at: result.created_at,
  };

  return { user: publicUser, accessToken, refreshToken };
};

// ============================================
// LOGIN - Local
// ============================================
export const loginLocal = async (data: {
  email: string;
  password: string;
}): Promise<{
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
}> => {
  // 1. Find user by email
  const user = await queryOne<IUser>(UserQueries.findByEmail, [data.email]);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // 2. Check if user is active
  if (!user.is_active) {
    throw new AppError("Your account has been deactivated. Contact admin.", 403);
  }

  // 3. Check auth provider - must be local
  if (user.auth_provider !== "local") {
    throw new AppError(
      `This account uses ${user.auth_provider} login. Please use ${user.auth_provider} to sign in.`,
      400
    );
  }

  // 4. Verify password
  if (!user.password_hash) {
    throw new AppError("Invalid login method", 400);
  }

  const isPasswordValid = await comparePassword(data.password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // 5. Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

  // 6. Store session in Redis
  await setCache(
    `session:${user.id}`,
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      isActive: true,
      loginAt: new Date().toISOString(),
      method: "local",
    },
    SESSION_EXPIRY
  );

  // 7. Store refresh token
  const tokenHash = Buffer.from(refreshToken).toString("base64").substring(0, 255);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, tokenHash]
  );

  // 8. Update last login
  await query(UserQueries.updateLastLogin, [user.id]);

  // 9. Log activity
  await query(
    `INSERT INTO activity_log (user_id, action, entity_type, entity_id)
     VALUES ($1, $2, $3, $4)`,
    [user.id, "user_login", "user", user.id]
  );

  logger.info(`✅ User logged in: ${user.email}`);

  const publicUser: IUserPublic = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    avatar_url: user.avatar_url,
    phone: user.phone,
    location: user.location,
    linkedin_url: user.linkedin_url,
    github_url: user.github_url,
    portfolio_url: user.portfolio_url,
    bio: user.bio,
    profile_completion: user.profile_completion,
    created_at: user.created_at,
  };

  return { user: publicUser, accessToken, refreshToken };
};

// ============================================
// OAUTH LOGIN/SIGNUP (Google, GitHub)
// ============================================
export const oauthLoginOrSignup = async (data: {
  email: string;
  full_name: string;
  provider: AuthProvider;
  providerId: string;
  avatarUrl?: string;
}): Promise<{
  user: IUserPublic;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}> => {
  let isNewUser = false;

  // 1. Check if user exists with this provider
  let user = await queryOne<IUser>(UserQueries.findByProviderId, [
    data.provider,
    data.providerId,
  ]);

  // 2. If not found by provider, check by email
  if (!user) {
    user = await queryOne<IUser>(UserQueries.findByEmail, [data.email]);

    if (user) {
      // Email exists but different provider
      if (user.auth_provider !== data.provider) {
        throw new AppError(
          `This email is registered with ${user.auth_provider}. Please use ${user.auth_provider} to login.`,
          409
        );
      }
    }
  }

  // 3. If no user found, create new one
  if (!user) {
    isNewUser = true;

    logger.debug(`Creating new OAuth user - email: ${data.email}, full_name: "${data.full_name}", provider: ${data.provider}`);

    const result = await transaction(async (client) => {
      // Validate data before insertion
      if (!data.email || !data.provider || !data.providerId) {
        throw new Error("Missing required OAuth user data");
      }

      const userResult = await client.query(UserQueries.createUser, [
        data.email,
        null, // no password for OAuth
        data.full_name || data.email.split("@")[0] || "User", // ensure we have a name
        "candidate", // default role for OAuth
        data.provider,
        data.providerId,
        data.avatarUrl || null,
      ]);

      const newUser = userResult.rows[0];

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      // Create candidate profile
      try {
        await client.query(UserQueries.createCandidateProfile, [newUser.id]);
      } catch (error) {
        logger.warn(`Warning: Could not create candidate profile for user ${newUser.id}:`, error);
        // Don't fail the entire transaction if candidate profile creation fails
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newUser.id,
          "user_signup",
          "user",
          newUser.id,
          JSON.stringify({ method: data.provider }),
        ]
      );

      return newUser;
    });

    user = result;
    logger.info(`✅ New OAuth user registered: ${data.email} with role "candidate" (${data.provider})`);
  }

  // Safety check - should never happen
  if (!user) {
    throw new AppError("User authentication failed", 500);
  }

  if (isNewUser && user) {
    logger.debug(`New user details - id: ${user.id}, full_name: "${user.full_name}", email: ${user.email}`);
  }

  // 4. Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

  // 5. Store session in Redis
  await setCache(
    `session:${user.id}`,
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      isActive: true,
      loginAt: new Date().toISOString(),
      method: data.provider,
    },
    SESSION_EXPIRY
  );

  // 6. Store refresh token
  const tokenHash = Buffer.from(refreshToken).toString("base64").substring(0, 255);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, tokenHash]
  );

  // 7. Update last login
  await query(UserQueries.updateLastLogin, [user.id]);

  const publicUser: IUserPublic = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    avatar_url: user.avatar_url,
    phone: user.phone,
    location: user.location,
    linkedin_url: user.linkedin_url,
    github_url: user.github_url,
    portfolio_url: user.portfolio_url,
    bio: user.bio,
    profile_completion: user.profile_completion,
    created_at: user.created_at,
  };

  return { user: publicUser, accessToken, refreshToken, isNewUser };
};

// ============================================
// REFRESH TOKEN
// ============================================
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  // 1. Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // 2. Check if token exists in DB and is not revoked
  const tokenHash = Buffer.from(refreshToken).toString("base64").substring(0, 255);
  const storedToken = await queryOne(
    `SELECT * FROM refresh_tokens 
     WHERE user_id = $1 AND token_hash = $2 AND is_revoked = FALSE AND expires_at > NOW()`,
    [decoded.userId, tokenHash]
  );

  if (!storedToken) {
    throw new AppError("Refresh token is revoked or expired", 401);
  }

  // 3. Check session in Redis
  const sessionData = await getCache<{ isActive: boolean }>(`session:${decoded.userId}`);
  if (!sessionData || !sessionData.isActive) {
    throw new AppError("Session expired. Please login again.", 401);
  }

  // 4. Revoke old refresh token
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1`,
    [storedToken.id]
  );

  // 5. Generate new token pair
  const tokenPayload: TokenPayload = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };

  const newTokens = generateTokenPair(tokenPayload);

  // 6. Store new refresh token
  const newTokenHash = Buffer.from(newTokens.refreshToken)
    .toString("base64")
    .substring(0, 255);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [decoded.userId, newTokenHash]
  );

  // 7. Extend session in Redis
  await setCache(
    `session:${decoded.userId}`,
    {
      ...sessionData,
      refreshedAt: new Date().toISOString(),
    },
    SESSION_EXPIRY
  );

  logger.info(`🔄 Token refreshed for user: ${decoded.userId}`);

  return newTokens;
};

// ============================================
// LOGOUT
// ============================================
export const logoutUser = async (userId: string): Promise<void> => {
  // 1. Delete session from Redis
  await deleteCache(`session:${userId}`);

  // 2. Revoke all refresh tokens for this user
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE`,
    [userId]
  );

  // 3. Log activity
  await query(
    `INSERT INTO activity_log (user_id, action, entity_type, entity_id)
     VALUES ($1, $2, $3, $4)`,
    [userId, "user_logout", "user", userId]
  );

  logger.info(`👋 User logged out: ${userId}`);
};

// ============================================
// GET CURRENT USER (from token)
// ============================================
export const getCurrentUser = async (
  userId: string
): Promise<IUserPublic | null> => {
  // 1. Check cache first
  const cached = await getCache<IUserPublic>(`profile:${userId}`);
  if (cached) {
    return cached;
  }

  // 2. Query PostgreSQL
  const user = await queryOne<IUser>(UserQueries.findById, [userId]);
  if (!user) return null;

  const publicUser: IUserPublic = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    avatar_url: user.avatar_url,
    phone: user.phone,
    location: user.location,
    linkedin_url: user.linkedin_url,
    github_url: user.github_url,
    portfolio_url: user.portfolio_url,
    bio: user.bio,
    profile_completion: user.profile_completion,
    created_at: user.created_at,
  };

  // 3. Cache for 30 minutes
  await setCache(`profile:${userId}`, publicUser, 30 * 60);

  return publicUser;
};

// ============================================
// CHANGE PASSWORD
// ============================================
export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // 1. Get user
  const user = await queryOne<IUser>(
    `SELECT id, password_hash, auth_provider FROM users WHERE id = $1`,
    [userId]
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.auth_provider !== "local") {
    throw new AppError(
      `Cannot change password for ${user.auth_provider} accounts`,
      400
    );
  }

  if (!user.password_hash) {
    throw new AppError("No password set for this account", 400);
  }

  // 2. Verify current password
  const isValid = await comparePassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  // 3. Hash new password
  const newHash = await hashPassword(newPassword);

  // 4. Update password
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    newHash,
    userId,
  ]);

  // 5. Revoke all refresh tokens (force re-login)
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1`,
    [userId]
  );

  logger.info(`🔒 Password changed for user: ${userId}`);
};