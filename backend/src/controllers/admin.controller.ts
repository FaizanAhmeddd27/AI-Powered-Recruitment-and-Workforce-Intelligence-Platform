import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";
import { sendSuccess } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";


export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await adminService.getPlatformStats();
    sendSuccess(res, 200, "Platform stats fetched", stats);
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await adminService.getAnalytics();
    sendSuccess(res, 200, "Analytics fetched", analytics);
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const health = await adminService.getSystemHealth();
    sendSuccess(res, 200, "System health checked", health);
  } catch (error) {
    next(error);
  }
};


export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 50);

    const filters = {
      role: req.query.role as string | undefined,
      search: req.query.search as string | undefined,
      is_active:
        req.query.is_active !== undefined
          ? req.query.is_active === "true"
          : undefined,
    };

    const result = await adminService.getAllUsers(page, limit, filters);

    sendSuccess(res, 200, "Users fetched", result.users, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};


export const getUserDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const user = await adminService.getUserDetail(userId);
    sendSuccess(res, 200, "User detail fetched", user);
  } catch (error) {
    next(error);
  }
};


export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      throw new AppError("is_active must be a boolean", 400);
    }

    // Prevent self-deactivation
    if (req.user?.userId === userId && !is_active) {
      throw new AppError("You cannot deactivate your own account", 400);
    }

    const user = await adminService.toggleUserStatus(userId, is_active);

    sendSuccess(
      res,
      200,
      `User ${is_active ? "activated" : "deactivated"} successfully`,
      user
    );
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = Math.min(
      parseInt((req.query.limit as string) || "20", 10),
      50
    );

    const activities = await adminService.getRecentActivity(limit);

    sendSuccess(res, 200, "Recent activity fetched", activities);
  } catch (error) {
    next(error);
  }
};