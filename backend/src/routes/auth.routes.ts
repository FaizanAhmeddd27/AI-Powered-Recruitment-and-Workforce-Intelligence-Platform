import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from "../validators/auth.validator";
import { authLimiter, signupLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();


router.post(
  "/signup",
  signupLimiter,
  validate(signupSchema),
  authController.signup
);
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleCallback);
router.get("/github", authController.githubAuth);
router.get("/github/callback", authController.githubCallback);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;