import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

// All routes require auth + admin role
router.use(authenticate, authorize("admin"));

// Platform Stats & Analytics
router.get("/stats", adminController.getStats);
router.get("/analytics", adminController.getAnalytics);
router.get("/health", adminController.getSystemHealth);

// User Management
router.get("/users", adminController.getUsers);
router.get("/users/:userId", adminController.getUserDetail);
router.patch("/users/:userId/toggle", adminController.toggleUserStatus);

// Activity Log
router.get("/activity", adminController.getRecentActivity);

export default router;