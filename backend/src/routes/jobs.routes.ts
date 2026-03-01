import { Router } from "express";
import * as jobsController from "../controllers/jobs.controller";
import * as appController from "../controllers/applications.controller";
import { authenticate, optionalAuth } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createJobSchema, updateJobSchema } from "../validators/job.validator";
import { createApplicationSchema } from "../validators/application.validator";
import { apiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();



router.get("/", apiLimiter, jobsController.searchJobs);

router.get(
  "/saved",
  authenticate,
  authorize("candidate"),
  jobsController.getSavedJobs
);

router.get(
  "/my-jobs",
  authenticate,
  authorize("recruiter"),
  jobsController.getMyJobs
);

router.get("/:id", optionalAuth, jobsController.getJobById);

router.post(
  "/",
  authenticate,
  authorize("recruiter"),
  validate(createJobSchema),
  jobsController.createJob
);

router.put(
  "/:id",
  authenticate,
  authorize("recruiter"),
  validate(updateJobSchema),
  jobsController.updateJob
);

router.patch(
  "/:id/close",
  authenticate,
  authorize("recruiter"),
  jobsController.closeJob
);

router.delete(
  "/:id",
  authenticate,
  authorize("recruiter", "admin"),
  jobsController.deleteJob
);
router.post(
  "/:id/save",
  authenticate,
  authorize("candidate"),
  jobsController.saveJob
);

router.delete(
  "/:id/save",
  authenticate,
  authorize("candidate"),
  jobsController.unsaveJob
);
router.post(
  "/:jobId/apply",
  authenticate,
  authorize("candidate"),
  validate(createApplicationSchema),
  appController.applyForJob
);

export default router;