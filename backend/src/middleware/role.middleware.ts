import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.utils";
import logger from "../utils/logger.utils";

type UserRole = "candidate" | "recruiter" | "admin";


export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "Authentication required");
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        `Access denied for user ${req.user.userId} (role: ${userRole}). Required: ${allowedRoles.join(", ")}`
      );
      sendError(
        res,
        403,
        `Access denied. Required role: ${allowedRoles.join(" or ")}`
      );
      return;
    }

    logger.debug(
      `Role authorized: ${userRole} for ${req.method} ${req.originalUrl}`
    );
    next();
  };
};


export const authorizeOwner = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "Authentication required");
      return;
    }

    const resourceOwnerId = req.params[paramName];

    // Admin can access anything
    if (req.user.role === "admin") {
      next();
      return;
    }

    if (req.user.userId !== resourceOwnerId) {
      sendError(res, 403, "You can only access your own resources");
      return;
    }

    next();
  };
};