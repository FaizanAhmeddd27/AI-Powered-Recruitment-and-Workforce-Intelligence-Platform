import { Request, Response, NextFunction } from "express";
import * as NotificationService from "../services/notification.service";
import { AppError } from "../middleware/error.middleware";
import logger from "../utils/logger.utils";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { limit, offset, unreadOnly } = req.query;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (role === "candidate") {
      await NotificationService.backfillCandidateStatusNotifications(userId);
    }

    const { notifications, total } = await NotificationService.getUserNotifications(
      userId,
      {
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
        unreadOnly: unreadOnly === "true",
      }
    );

    res.status(200).json({
      success: true,
      data: {
        notifications,
        total,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const { notifications, total } = await NotificationService.getUserNotifications(
      userId,
      { unreadOnly: true, limit: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        unread_count: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params as { notificationId: string };
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Verify notification belongs to user
    const { notifications } = await NotificationService.getUserNotifications(userId, {
      limit: 1000,
    });

    const notificationBelongsToUser = notifications.some(n => n.id === notificationId);
    if (!notificationBelongsToUser) {
      throw new AppError("Notification not found or does not belong to you", 404);
    }

    const notification = await NotificationService.markNotificationAsRead(
      notificationId
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    await NotificationService.markAllNotificationsAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params as { notificationId: string };
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    // Verify notification belongs to user
    const { notifications } = await NotificationService.getUserNotifications(userId, {
      limit: 1000,
    });

    const notificationBelongsToUser = notifications.some(n => n.id === notificationId);
    if (!notificationBelongsToUser) {
      throw new AppError("Notification not found or does not belong to you", 404);
    }

    await NotificationService.deleteNotification(notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const createTestNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { type, title, message, related_entity_type, related_entity_id } = req.body;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!type || !title || !message) {
      throw new AppError("type, title, and message are required", 400);
    }

    const notification = await NotificationService.createNotification({
      user_id: userId,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
    });

    res.status(201).json({
      success: true,
      message: "Test notification created",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
