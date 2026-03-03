import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import * as OfferController from "../controllers/offer.controller";

const router = express.Router();

// All offer routes require authentication
router.use(authenticate);

// Recruiter - Create offer for an application
router.post(
  "/applications/:applicationId/offers",
  authorize("recruiter"),
  OfferController.createOffer
);

// Get offer for an application
router.get(
  "/applications/:applicationId/offers",
  OfferController.getApplicationOffer
);

// Get specific offer details
router.get(
  "/offers/:offerId",
  OfferController.getOffer
);

// Candidate - Accept offer
router.post(
  "/offers/:offerId/accept",
  authorize("candidate"),
  OfferController.acceptOffer
);

// Candidate - Decline offer
router.post(
  "/offers/:offerId/decline",
  authorize("candidate"),
  OfferController.declineOffer
);

// Recruiter - Rescind offer
router.post(
  "/offers/:offerId/rescind",
  authorize("recruiter"),
  OfferController.rescindOffer
);

// Candidate - Get all their offers
router.get(
  "/candidates/offers",
  authorize("candidate"),
  OfferController.getCandidateOffers
);

// Recruiter - Get all offers for a job
router.get(
  "/jobs/:jobId/offers",
  authorize("recruiter"),
  OfferController.getRecruiterOffers
);

// Admin - Check and mark expired offers
router.post(
  "/offers/check-expired",
  authorize("admin"),
  OfferController.checkExpiredOffers
);

export default router;
