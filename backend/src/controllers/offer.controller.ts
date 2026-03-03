import { Request, Response, NextFunction } from "express";
import * as OffersService from "../services/offer.service";
import * as ApplicationService from "../services/applications.service";
import { createNotification, notifyOfferReceived } from "../services/notification.service";
import { AppError } from "../middleware/error.middleware";
import logger from "../utils/logger.utils";

export const createOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { applicationId } = req.params as { applicationId: string };
    const { salary_offered, joining_date, benefits, offer_letter_url, expiry_date } = req.body;

    if (!salary_offered || !joining_date) {
      throw new AppError("salary_offered and joining_date are required", 400);
    }

    // Verify application exists and get details for notification
    const application = await ApplicationService.getApplicationDetails(applicationId);
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    const offer = await OffersService.createOffer({
      application_id: applicationId,
      salary_offered,
      joining_date: new Date(joining_date),
      benefits,
      offer_letter_url,
      expiry_date: expiry_date ? new Date(expiry_date) : undefined,
    });

    // Send notification to candidate
    try {
      await notifyOfferReceived(
        application.candidate_id,
        applicationId,
        application.job_title,
        salary_offered,
        new Date(joining_date)
      );
    } catch (notifyError) {
      logger.error("Failed to send offer notification:", notifyError);
    }

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

export const getOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offerId } = req.params as { offerId: string };

    const offer = await OffersService.getOffer(offerId);

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { applicationId } = req.params as { applicationId: string };

    const offer = await OffersService.getApplicationOffer(applicationId);

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offerId } = req.params as { offerId: string };
    const candidateId = req.user?.userId;

    if (!candidateId) {
      throw new AppError("Unauthorized", 401);
    }

    // Get offer to verify it belongs to candidate
    const offer = await OffersService.getOffer(offerId);
    const application = await ApplicationService.getApplicationDetails(offer.application_id);

    if (application.candidate_id !== candidateId) {
      throw new AppError("You can only accept your own offers", 403);
    }

    const updatedOffer = await OffersService.acceptOffer(offerId);

    // Update application status to hired
    await ApplicationService.updateApplicationStatus(
      offer.application_id,
      application.recruiter_id,
      "hired"
    );

    // Send notification
    try {
      await createNotification({
        user_id: candidateId,
        type: "offer_accepted",
        title: "🎉 Welcome Aboard!",
        message: `Congratulations! You've accepted the offer and are now hired. Welcome to the team!`,
        related_entity_type: "offer",
        related_entity_id: offerId,
      });
    } catch (notifyError) {
      logger.error("Failed to send acceptance notification:", notifyError);
    }

    res.status(200).json({
      success: true,
      message: "Offer accepted successfully",
      data: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

export const declineOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offerId } = req.params as { offerId: string };
    const candidateId = req.user?.userId;
    const { reason, feedback } = req.body;

    if (!candidateId) {
      throw new AppError("Unauthorized", 401);
    }

    // Get offer to verify it belongs to candidate
    const offer = await OffersService.getOffer(offerId);
    const application = await ApplicationService.getApplicationDetails(offer.application_id);

    if (application.candidate_id !== candidateId) {
      throw new AppError("You can only decline your own offers", 403);
    }

    const updatedOffer = await OffersService.declineOffer(offerId, reason, feedback);

    // Send notification
    try {
      await createNotification({
        user_id: candidateId,
        type: "offer_declined",
        title: "Offer Status Update",
        message: `You've declined the offer. Thank you for considering the opportunity.`,
        related_entity_type: "offer",
        related_entity_id: offerId,
      });
    } catch (notifyError) {
      logger.error("Failed to send decline notification:", notifyError);
    }

    res.status(200).json({
      success: true,
      message: "Offer declined successfully",
      data: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

export const checkExpiredOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const expiredOffers = await OffersService.checkExpiredOffers();

    res.status(200).json({
      success: true,
      message: `${expiredOffers.length} offers marked as expired`,
      data: expiredOffers,
    });
  } catch (error) {
    next(error);
  }
};

export const rescindOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { offerId } = req.params as { offerId: string };
    const { reason } = req.body;

    if (!reason) {
      throw new AppError("Rescission reason is required", 400);
    }

    // Get offer and application details for notification
    const offer = await OffersService.getOffer(offerId);
    const application = await ApplicationService.getApplicationDetails(offer.application_id);

    const updatedOffer = await OffersService.rescindOffer(offerId, reason);

    // Notify candidate of rescission
    try {
      await createNotification({
        user_id: application.candidate_id,
        type: "offer_rescinded",
        title: "Offer Rescinded",
        message: `We regret to inform you that we have rescinded the job offer. Reason: ${reason}`,
        related_entity_type: "offer",
        related_entity_id: offerId,
      });
    } catch (notifyError) {
      logger.error("Failed to send rescission notification:", notifyError);
    }

    res.status(200).json({
      success: true,
      message: "Offer rescinded successfully",
      data: updatedOffer,
    });
  } catch (error) {
    next(error);
  }
};

export const getCandidateOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const candidateId = req.user?.userId;

    if (!candidateId) {
      throw new AppError("Unauthorized", 401);
    }

    const offers = await OffersService.getCandidateOffers(candidateId);

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecruiterOffers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params as { jobId: string };
    const { limit } = req.query;

    const offers = await OffersService.getRecruiterOffers(
      jobId,
      limit ? parseInt(limit as string) : 20
    );

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};
