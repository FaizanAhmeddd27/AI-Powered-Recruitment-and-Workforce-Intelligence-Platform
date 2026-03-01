import { Request, Response, NextFunction } from "express";
import * as resumeService from "../services/resume.service";
import * as aiService from "../services/ai.service";
import { sendSuccess, sendError } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";
import logger from "../utils/logger.utils";

export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!req.file) {
      throw new AppError("No file uploaded. Please select a PDF file.", 400);
    }

    const result = await resumeService.uploadResume(req.user.userId, req.file);

    sendSuccess(res, 201, "Resume uploaded successfully!", result);
  } catch (error) {
    next(error);
  }
};

export const uploadAndParse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!req.file) {
      throw new AppError("No file uploaded. Please select a PDF file.", 400);
    }

    // 1. Upload
    const uploadResult = await resumeService.uploadResume(
      req.user.userId,
      req.file
    );

    // 2. Parse immediately
    const parseResult = await resumeService.parseResume(
      req.user.userId,
      uploadResult.resumeId
    );

    sendSuccess(res, 201, "Resume uploaded and analyzed successfully!", {
      resume: uploadResult,
      ...parseResult,
    });
  } catch (error) {
    next(error);
  }
};

export const queueForParsing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { resumeId } = req.params as { resumeId: string };

    await resumeService.queueResumeForParsing(req.user.userId, resumeId);

    sendSuccess(res, 202, "Resume queued for AI analysis. This may take 10-15 seconds.", {
      resumeId,
      status: "queued",
    });
  } catch (error) {
    next(error);
  }
};

export const parseResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { resumeId } = req.params as { resumeId: string };

    const result = await resumeService.parseResume(req.user.userId, resumeId);

    sendSuccess(res, 200, "Resume analyzed successfully!", result);
  } catch (error) {
    next(error);
  }
};

export const getParsingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { resumeId } = req.params as { resumeId: string };

    const status = await resumeService.getResumeStatus(resumeId);

    sendSuccess(res, 200, "Resume status fetched", { resumeId, status });
  } catch (error) {
    next(error);
  }
};

export const getParsedResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = await resumeService.getParsedResume(req.user.userId);

    if (!parsed) {
      sendSuccess(res, 200, "No parsed resume found. Please upload and parse a resume.", {
        parsed: null,
      });
      return;
    }

    sendSuccess(res, 200, "Parsed resume data fetched", parsed);
  } catch (error) {
    next(error);
  }
};

export const getMyResumes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const resumes = await resumeService.getUserResumes(req.user.userId);

    sendSuccess(res, 200, "Resumes fetched", resumes);
  } catch (error) {
    next(error);
  }
};

export const downloadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { resumeId } = req.params as { resumeId: string };

    const { stream, filename, contentType } =
      await resumeService.downloadResumeFile(
        resumeId,
        req.user.userId,
        req.user.role
      );

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    stream.pipe(res);

    stream.on("error", (err: Error) => {
      logger.error(`❌ Download stream error: ${err.message}`);
      if (!res.headersSent) {
        sendError(res, 500, "Error downloading resume");
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { resumeId } = req.params as { resumeId: string };

    await resumeService.deleteResume(req.user.userId, resumeId);

    sendSuccess(res, 200, "Resume deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getCandidateParsedResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { candidateId } = req.params as { candidateId: string };

    const hasAccess = await import("../config/db").then(({ queryOne }) =>
      queryOne(
        `SELECT a.id FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.candidate_id = $1 AND j.recruiter_id = $2
         LIMIT 1`,
        [candidateId, req.user!.userId]
      )
    );

    if (!hasAccess && req.user.role !== "admin") {
      throw new AppError(
        "You can only view resumes of candidates who applied to your jobs",
        403
      );
    }

    const parsed = await resumeService.getParsedResume(candidateId);

    if (!parsed) {
      throw new AppError("No parsed resume found for this candidate", 404);
    }

    sendSuccess(res, 200, "Candidate resume data fetched", parsed);
  } catch (error) {
    next(error);
  }
};