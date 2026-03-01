import { Request, Response, NextFunction } from "express";
import * as jobsService from "../services/jobs.service";
import { sendSuccess, sendError } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";
import logger from "../utils/logger.utils";


export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await jobsService.createJob(req.user.userId, req.body);

    sendSuccess(res, 201, "Job posted successfully!", result);
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const result = await jobsService.getJobById(id);

    if (!result) {
      throw new AppError("Job not found", 404);
    }

    sendSuccess(res, 200, "Job fetched successfully", result);
  } catch (error) {
    next(error);
  }
};


export const searchJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = {
      search: req.query.search as string | undefined,
      location: req.query.location as string | undefined,
      job_type: req.query.job_type as string | undefined,
      workplace_type: req.query.workplace_type as string | undefined,
      experience_level: req.query.experience_level as string | undefined,
      salary_min: req.query.salary_min
        ? parseInt(req.query.salary_min as string, 10)
        : undefined,
      salary_max: req.query.salary_max
        ? parseInt(req.query.salary_max as string, 10)
        : undefined,
      page: parseInt((req.query.page as string) || "1", 10),
      limit: Math.min(parseInt((req.query.limit as string) || "10", 10), 50),
      sort_by: (req.query.sort_by as string) || "created_at",
      sort_order: (req.query.sort_order as string) || "desc",
    };

    const result = await jobsService.searchJobs(filters);

    sendSuccess(res, 200, "Jobs fetched successfully", result.jobs, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};


export const getMyJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = Math.min(parseInt((req.query.limit as string) || "10", 10), 50);

    const result = await jobsService.getRecruiterJobs(
      req.user.userId,
      page,
      limit
    );

    sendSuccess(res, 200, "Your jobs fetched successfully", result.jobs, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};


export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };

    const result = await jobsService.updateJob(id, req.user.userId, req.body);

    sendSuccess(res, 200, "Job updated successfully", result);
  } catch (error) {
    next(error);
  }
};


export const closeJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };

    const result = await jobsService.closeJob(id, req.user.userId);

    sendSuccess(res, 200, "Job closed successfully", result);
  } catch (error) {
    next(error);
  }
};


export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };
    const isAdmin = req.user.role === "admin";

    await jobsService.deleteJob(id, req.user.userId, isAdmin);

    sendSuccess(res, 200, "Job deleted successfully");
  } catch (error) {
    next(error);
  }
};


export const saveJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };

    await jobsService.saveJob(req.user.userId, id);

    sendSuccess(res, 201, "Job saved successfully");
  } catch (error) {
    next(error);
  }
};


export const unsaveJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { id } = req.params as { id: string };

    await jobsService.unsaveJob(req.user.userId, id);

    sendSuccess(res, 200, "Job unsaved successfully");
  } catch (error) {
    next(error);
  }
};


export const getSavedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = Math.min(parseInt((req.query.limit as string) || "10", 10), 50);

    const result = await jobsService.getSavedJobs(
      req.user.userId,
      page,
      limit
    );

    sendSuccess(res, 200, "Saved jobs fetched successfully", result.jobs, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};