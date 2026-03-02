import { Request, Response, NextFunction } from "express";
import passport from "passport";
import * as authService from "../services/auth.service";
import { sendSuccess, sendError } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";
import env from "../config/env";
import logger from "../utils/logger.utils";


export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, full_name, role } = req.body;

    const result = await authService.signupLocal({
      email,
      password,
      full_name,
      role,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth",
    });

    sendSuccess(res, 201, "Account created successfully!", {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginLocal({ email, password });

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    sendSuccess(res, 200, "Login successful!", {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};


export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});


export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    "google",
    { session: false },
    async (err: any, profile: any, info: any) => {
      try {
        if (err) {
          logger.error(`❌ Google auth error: ${err.message}`);
          return res.redirect(
            `${env.CLIENT_URL}/login?error=google_auth_failed`
          );
        }

        if (!profile) {
          return res.redirect(
            `${env.CLIENT_URL}/login?error=google_no_profile`
          );
        }

        // Use oauth service
        const result = await authService.oauthLoginOrSignup({
          email: profile.email,
          full_name: profile.full_name,
          provider: "google",
          providerId: profile.providerId,
          avatarUrl: profile.avatarUrl,
        });

        // Set refresh token cookie
        res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/api/auth",
        });

        // Redirect to frontend with tokens
        const redirectUrl = `${env.CLIENT_URL}/oauth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}&isNew=${result.isNewUser}`;
        res.redirect(redirectUrl);
      } catch (error: any) {
        logger.error(`❌ Google callback error: ${error.message}`);
        res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(error.message)}`
        );
      }
    }
  )(req, res, next);
};


export const githubAuth = passport.authenticate("github", {
  scope: ["user:email"],
  session: false,
});


export const githubCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    "github",
    { session: false },
    async (err: any, profile: any, info: any) => {
      try {
        if (err) {
          logger.error(`❌ GitHub auth error: ${err.message}`);
          return res.redirect(
            `${env.CLIENT_URL}/login?error=github_auth_failed`
          );
        }

        if (!profile) {
          return res.redirect(
            `${env.CLIENT_URL}/login?error=github_no_profile`
          );
        }

        const result = await authService.oauthLoginOrSignup({
          email: profile.email,
          full_name: profile.full_name,
          provider: "github",
          providerId: profile.providerId,
          avatarUrl: profile.avatarUrl,
        });

        res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/api/auth",
        });

        const redirectUrl = `${env.CLIENT_URL}/oauth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}&isNew=${result.isNewUser}`;
        res.redirect(redirectUrl);
      } catch (error: any) {
        logger.error(`❌ GitHub callback error: ${error.message}`);
        res.redirect(
          `${env.CLIENT_URL}/login?error=${encodeURIComponent(error.message)}`
        );
      }
    }
  )(req, res, next);
};


export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get refresh token from cookie or body
    const token =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      throw new AppError("Refresh token is required", 400);
    }

    const result = await authService.refreshAccessToken(token);

    // Update cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    sendSuccess(res, 200, "Token refreshed successfully", {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};


export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    await authService.logoutUser(req.user.userId);

    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
    });

    sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};


export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const user = await authService.getCurrentUser(req.user.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    sendSuccess(res, 200, "User profile fetched", { user });
  } catch (error) {
    next(error);
  }
};


export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const { currentPassword, newPassword } = req.body;

    await authService.changeUserPassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    sendSuccess(res, 200, "Password changed successfully. Please login again.");
  } catch (error) {
    next(error);
  }
};