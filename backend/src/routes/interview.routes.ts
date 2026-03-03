import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import * as InterviewController from "../controllers/interview.controller";

const router = express.Router();

// All interview routes require authentication
router.use(authenticate);

// Recruiter - Create interview for an application
router.post(
  "/applications/:applicationId/interviews",
  authorize("recruiter"),
  InterviewController.createInterview
);

// Get interviews for an application
router.get(
  "/applications/:applicationId/interviews",
  InterviewController.getApplicationInterviews
);

// Get specific interview details
router.get(
  "/interviews/:interviewId",
  InterviewController.getInterview
);

// Update interview (reschedule, update notes, assign interviewer, etc)
router.patch(
  "/interviews/:interviewId",
  authorize("recruiter"),
  InterviewController.updateInterview
);

// Complete interview with feedback
router.post(
  "/interviews/:interviewId/complete",
  authorize("recruiter"),
  InterviewController.completeInterview
);

// Reschedule interview
router.post(
  "/interviews/:interviewId/reschedule",
  authorize("recruiter"),
  InterviewController.rescheduleInterview
);

// Cancel interview
router.post(
  "/interviews/:interviewId/cancel",
  authorize("recruiter"),
  InterviewController.cancelInterview
);

// Candidate - Accept/Decline interview
router.post(
  "/interviews/:interviewId/respond",
  authorize("candidate"),
  InterviewController.respondToInterview
);

// Get upcoming interviews for recruiter
router.get(
  "/interviews/upcoming",
  authorize("recruiter"),
  InterviewController.getUpcomingInterviews
);

// Get feedback for an interview
router.get(
  "/interviews/:interviewId/feedback",
  InterviewController.getInterviewFeedback
);

// Update feedback for an interview
router.patch(
  "/interviews/:interviewId/feedback",
  authorize("recruiter"),
  InterviewController.updateInterviewFeedback
);

// Admin - Send interview reminders (scheduled job)
router.post(
  "/interviews/reminders/send",
  authorize("admin"),
  InterviewController.sendReminders
);

export default router;
