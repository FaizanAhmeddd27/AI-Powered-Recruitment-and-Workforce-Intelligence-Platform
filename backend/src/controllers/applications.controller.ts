import { Request, Response, NextFunction } from "express";
import * as applicationsService from "../services/applications.service";
import { sendSuccess, sendError } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";
import logger from "../utils/logger.utils";


export const applyForJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { jobId } = req.params as { jobId: string };

    const application = await applicationsService.applyForJob(
      req.user.userId,
      jobId,
      {
        cover_letter: req.body.cover_letter,
        expected_salary: req.body.expected_salary,
        notice_period_days: req.body.notice_period_days,
        resume_mongo_id: req.body.resume_mongo_id,
      }
    );

    sendSuccess(res, 201, "Application submitted successfully!", application);
  } catch (error) {
    next(error);
  }
};


export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const options = {
      status: req.query.status as string | undefined,
      page: parseInt((req.query.page as string) || "1", 10),
      limit: Math.min(parseInt((req.query.limit as string) || "10", 10), 50),
      sort_by: (req.query.sort_by as string) || "applied_at",
      sort_order: (req.query.sort_order as string) || "desc",
    };

    const result = await applicationsService.getCandidateApplications(
      req.user.userId,
      options
    );

    sendSuccess(
      res,
      200,
      "Applications fetched successfully",
      result.applications,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    );
  } catch (error) {
    next(error);
  }
};


export const getJobApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { jobId } = req.params as { jobId: string };

    const options = {
      status: req.query.status as string | undefined,
      page: parseInt((req.query.page as string) || "1", 10),
      limit: Math.min(parseInt((req.query.limit as string) || "10", 10), 50),
      sort_by: (req.query.sort_by as string) || "ai_match_score",
      sort_order: (req.query.sort_order as string) || "desc",
    };

    const result = await applicationsService.getJobApplications(
      jobId,
      req.user.userId,
      options
    );

    sendSuccess(
      res,
      200,
      "Job applications fetched successfully",
      result.applications,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    );
  } catch (error) {
    next(error);
  }
};


export const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };

    const application = await applicationsService.getApplicationById(
      id,
      req.user.userId,
      req.user.role
    );

    sendSuccess(res, 200, "Application details fetched", application);
  } catch (error) {
    next(error);
  }
};


export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };
    const { status } = req.body;

    const updated = await applicationsService.updateApplicationStatus(
      id,
      req.user.userId,
      status
    );

    sendSuccess(res, 200, `Application status updated to "${status}"`, updated);
  } catch (error) {
    next(error);
  }
};


export const bulkUpdateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { application_ids, status } = req.body;

    const result = await applicationsService.bulkUpdateStatus(
      req.user.userId,
      application_ids,
      status
    );

    sendSuccess(res, 200, `Bulk update complete: ${result.updated} updated`, result);
  } catch (error) {
    next(error);
  }
};

export const addNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };
    const { notes } = req.body;

    const updated = await applicationsService.addRecruiterNotes(
      id,
      req.user.userId,
      notes
    );

    sendSuccess(res, 200, "Notes added successfully", updated);
  } catch (error) {
    next(error);
  }
};


export const getCandidateStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const stats = await applicationsService.getCandidateStats(req.user.userId);

    sendSuccess(res, 200, "Candidate stats fetched", stats);
  } catch (error) {
    next(error);
  }
};


export const getRecruiterStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const stats = await applicationsService.getRecruiterStats(req.user.userId);

    sendSuccess(res, 200, "Recruiter stats fetched", stats);
  } catch (error) {
    next(error);
  }
};


export const getRecentApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const limit = Math.min(
      parseInt((req.query.limit as string) || "10", 10),
      20
    );

    const applications =
      await applicationsService.getRecentApplicationsForRecruiter(
        req.user.userId,
        limit
      );

    sendSuccess(res, 200, "Recent applications fetched", applications);
  } catch (error) {
    next(error);
  }
};


export const checkIfApplied = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { jobId } = req.params as { jobId: string };

    const hasApplied = await applicationsService.hasApplied(
      req.user.userId,
      jobId
    );

    sendSuccess(res, 200, "Application check completed", {
      has_applied: hasApplied,
    });
  } catch (error) {
    next(error);
  }
};


export const withdrawApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };
    const { withdrawal_reason } = req.body;

    const application = await applicationsService.withdrawApplication(
      id,
      req.user.userId,
      withdrawal_reason
    );

    sendSuccess(res, 200, "Application withdrawn successfully", application);
  } catch (error) {
    next(error);
  }
};