import { Router } from "express";
import * as appController from "../controllers/applications.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createApplicationSchema,
  updateStatusSchema,
  recruiterNotesSchema,
  withdrawApplicationSchema,
  bulkStatusUpdateSchema,
} from "../validators/application.validator";
import { apiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();


router.get(
  "/me",
  authenticate,
  authorize("candidate"),
  appController.getMyApplications
);


router.get(
  "/stats/candidate",
  authenticate,
  authorize("candidate"),
  appController.getCandidateStats
);

router.get(
  "/check/:jobId",
  authenticate,
  authorize("candidate"),
  appController.checkIfApplied
);


router.patch(
  "/:id/withdraw",
  authenticate,
  authorize("candidate"),
  validate(withdrawApplicationSchema),
  appController.withdrawApplication
);


router.get(
  "/stats/recruiter",
  authenticate,
  authorize("recruiter"),
  appController.getRecruiterStats
);


router.get(
  "/recent",
  authenticate,
  authorize("recruiter"),
  appController.getRecentApplications
);


router.get(
  "/job/:jobId",
  authenticate,
  authorize("recruiter"),
  appController.getJobApplications
);


router.patch(
  "/:id/status",
  authenticate,
  authorize("recruiter"),
  validate(updateStatusSchema),
  appController.updateStatus
);


router.patch(
  "/bulk-status",
  authenticate,
  authorize("recruiter"),
  validate(bulkStatusUpdateSchema),
  appController.bulkUpdateStatus
);


router.patch(
  "/:id/notes",
  authenticate,
  authorize("recruiter"),
  validate(recruiterNotesSchema),
  appController.addNotes
);

router.get(
  "/:id",
  authenticate,
  authorize("candidate", "recruiter", "admin"),
  appController.getApplicationById
);

export default router;