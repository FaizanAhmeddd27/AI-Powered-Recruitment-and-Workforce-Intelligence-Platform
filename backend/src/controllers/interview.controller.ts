import { Request, Response, NextFunction } from "express";
import * as InterviewService from "../services/interview.service";
import * as OffersService from "../services/offer.service";
import { AppError } from "../middleware/error.middleware";
import logger from "../utils/logger.utils";

export const createInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { applicationId } = req.params as { applicationId: string };
    const { interview_type, scheduled_at, interviewer_id, meeting_link, meeting_type, notes } = req.body;

    if (!interview_type || !scheduled_at) {
      throw new AppError("interview_type and scheduled_at are required", 400);
    }

    const interview = await InterviewService.createInterview({
      application_id: applicationId,
      interview_type,
      scheduled_at: new Date(scheduled_at),
      interviewer_id,
      meeting_link,
      meeting_type: meeting_type || "video_call",
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Interview created successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };
    const updates = req.body;

    if (updates.scheduled_at) {
      updates.scheduled_at = new Date(updates.scheduled_at);
    }

    const interview = await InterviewService.updateInterview(interviewId, updates);

    res.status(200).json({
      success: true,
      message: "Interview updated successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };

    const interview = await InterviewService.getInterview(interviewId);

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { applicationId } = req.params as { applicationId: string };

    const interviews = await InterviewService.getApplicationInterviews(applicationId);

    res.status(200).json({
      success: true,
      data: interviews,
    });
  } catch (error) {
    next(error);
  }
};

export const completeInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };
    const { technical_score, communication_score, culture_fit_score, recommendation, notes } = req.body;

    if (!recommendation) {
      throw new AppError("recommendation is required", 400);
    }

    const interview = await InterviewService.completeInterview(interviewId, {
      technical_score,
      communication_score,
      culture_fit_score,
      recommendation,
      notes,
    });

    res.status(200).json({
      success: true,
      message: "Interview completed successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const rescheduleInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };
    const { scheduled_at, notes } = req.body;

    if (!scheduled_at) {
      throw new AppError("scheduled_at is required", 400);
    }

    const interview = await InterviewService.rescheduleInterview(
      interviewId,
      new Date(scheduled_at),
      notes
    );

    res.status(200).json({
      success: true,
      message: "Interview rescheduled successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };
    const { cancellation_reason } = req.body;

    if (!cancellation_reason) {
      throw new AppError("cancellation_reason is required", 400);
    }

    const interview = await InterviewService.cancelInterview(
      interviewId,
      cancellation_reason
    );

    res.status(200).json({
      success: true,
      message: "Interview cancelled successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { limit } = req.query;

    const interviews = await InterviewService.getUpcomingInterviews(
      userId,
      limit ? parseInt(limit as string) : 10
    );

    res.status(200).json({
      success: true,
      data: interviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };

    const feedback = await InterviewService.getInterviewFeedback(interviewId);

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInterviewFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };
    const feedback = req.body;

    const updatedFeedback = await InterviewService.updateInterviewFeedback(
      interviewId,
      feedback
    );

    res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      data: updatedFeedback,
    });
  } catch (error) {
    next(error);
  }
};

export const sendReminders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await InterviewService.sendInterviewReminders();

    res.status(200).json({
      success: true,
      message: "Interview reminders sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const respondToInterview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { interviewId } = req.params as { interviewId: string };
    const candidateId = req.user?.userId;
    const { response, reason } = req.body as {
      response: "accepted" | "declined";
      reason?: string;
    };

    if (!candidateId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!response || !["accepted", "declined"].includes(response)) {
      throw new AppError("response must be 'accepted' or 'declined'", 400);
    }

    const interview = await InterviewService.respondToInterview(
      interviewId,
      candidateId,
      response,
      reason
    );

    res.status(200).json({
      success: true,
      message:
        response === "accepted"
          ? "Interview accepted successfully"
          : "Interview declined successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};
