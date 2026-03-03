import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import * as NotificationController from "../controllers/notification.controller";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Get all notifications for user
router.get(
  "/notifications",
  NotificationController.getNotifications
);

// Get unread notification count
router.get(
  "/notifications/count/unread",
  NotificationController.getUnreadCount
);

// Mark specific notification as read
router.post(
  "/notifications/:notificationId/read",
  NotificationController.markNotificationAsRead
);

// Mark all notifications as read
router.post(
  "/notifications/read-all",
  NotificationController.markAllAsRead
);

// Delete a notification
router.delete(
  "/notifications/:notificationId",
  NotificationController.deleteNotification
);

// Developer/Testing - Create test notification
router.post(
  "/notifications/test",
  NotificationController.createTestNotification
);

export default router;
