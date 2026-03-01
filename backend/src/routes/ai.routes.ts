import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { aiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.get(
  "/match/:jobId",
  authenticate,
  authorize("candidate"),
  aiLimiter,
  aiController.getMatchScore
);


router.get(
  "/detailed-match/:jobId",
  authenticate,
  authorize("candidate"),
  aiLimiter,
  aiController.getDetailedMatchScore
);


router.get(
  "/recommendations",
  authenticate,
  authorize("candidate"),
  aiLimiter,
  aiController.getJobRecommendations
);



router.post(
  "/generate-description",
  authenticate,
  authorize("recruiter"),
  aiLimiter,
  aiController.generateJobDescription
);

router.get(
  "/rank/:jobId",
  authenticate,
  authorize("recruiter"),
  aiLimiter,
  aiController.rankCandidates
);

export default router;