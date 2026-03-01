import { Router } from "express";
import * as recruiterController from "../controllers/recruiter.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateProfileSchema } from "../validators/profile.validator";

const router = Router();

// All routes require auth + recruiter role
router.use(authenticate, authorize("recruiter"));

// Dashboard
router.get("/dashboard", recruiterController.getDashboard);

// Profile
router.get("/profile", recruiterController.getProfile);
router.put(
  "/profile",
  validate(updateProfileSchema),
  recruiterController.updateProfile
);

// Application pipeline for a job
router.get("/pipeline/:jobId", recruiterController.getApplicationPipeline);

// View candidate profile (if candidate applied to recruiter's job)
router.get("/candidate/:candidateId", recruiterController.viewCandidateProfile);

export default router;