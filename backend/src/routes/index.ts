import { Router } from "express";
import authRoutes from "./auth.routes";
import jobRoutes from "./jobs.routes";
import applicationRoutes from "./applications.routes";
import resumeRoutes from "./resume.routes";
import aiRoutes from "./ai.routes";
import candidateRoutes from "./candidate.routes";
import recruiterRoutes from "./recruiter.routes";
import adminRoutes from "./admin.routes";
import interviewRoutes from "./interview.routes";
import offerRoutes from "./offer.routes";
import notificationRoutes from "./notification.routes";

const router = Router();


router.use("/auth", authRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/resume", resumeRoutes);
router.use("/ai", aiRoutes);
router.use("/candidate", candidateRoutes);
router.use("/recruiter", recruiterRoutes);
router.use("/admin", adminRoutes);
router.use("/", interviewRoutes);
router.use("/", offerRoutes);
router.use("/", notificationRoutes);

export default router;