import { Router } from "express";
import * as resumeController from "../controllers/resume.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import {
  uploadResume,
  handleMulterError,
} from "../middleware/upload.middleware";
import { uploadLimiter, aiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();



router.post(
  "/upload",
  authenticate,
  authorize("candidate"),
  uploadLimiter,
  uploadResume.single("resume"),
  handleMulterError,
  resumeController.uploadResume
);


router.post(
  "/upload-and-parse",
  authenticate,
  authorize("candidate"),
  uploadLimiter,
  uploadResume.single("resume"),
  handleMulterError,
  resumeController.uploadAndParse
);


router.post(
  "/parse/:resumeId",
  authenticate,
  authorize("candidate"),
  aiLimiter,
  resumeController.parseResume
);


router.post(
  "/queue/:resumeId",
  authenticate,
  authorize("candidate"),
  resumeController.queueForParsing
);


router.get(
  "/status/:resumeId",
  authenticate,
  authorize("candidate"),
  resumeController.getParsingStatus
);


router.get(
  "/parsed",
  authenticate,
  authorize("candidate"),
  resumeController.getParsedResume
);


router.get(
  "/my-resumes",
  authenticate,
  authorize("candidate"),
  resumeController.getMyResumes
);


router.get(
  "/download/:resumeId",
  authenticate,
  authorize("candidate", "recruiter", "admin"),
  resumeController.downloadResume
);


router.delete(
  "/:resumeId",
  authenticate,
  authorize("candidate"),
  resumeController.deleteResume
);




router.get(
  "/candidate/:candidateId",
  authenticate,
  authorize("recruiter", "admin"),
  resumeController.getCandidateParsedResume
);

export default router;