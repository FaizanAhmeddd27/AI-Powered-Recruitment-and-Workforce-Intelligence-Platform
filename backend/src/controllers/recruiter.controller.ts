import { Request, Response, NextFunction } from "express";
import * as recruiterService from "../services/recruiter.service";
import * as candidateService from "../services/candidate.service";
import { sendSuccess } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";


export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const data = await recruiterService.getDashboardData(req.user.userId);

    sendSuccess(res, 200, "Dashboard data fetched", data);
  } catch (error) {
    next(error);
  }
};


export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const profile = await recruiterService.getRecruiterProfile(req.user.userId);

    sendSuccess(res, 200, "Profile fetched", profile);
  } catch (error) {
    next(error);
  }
};


export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const result = await candidateService.updateBasicProfile(
      req.user.userId,
      req.body
    );

    sendSuccess(res, 200, "Profile updated", result);
  } catch (error) {
    next(error);
  }
};


export const getApplicationPipeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const jobId = req.params.jobId as string;

    const pipeline = await recruiterService.getApplicationPipeline(
      req.user.userId,
      jobId
    );

    sendSuccess(res, 200, "Pipeline data fetched", pipeline);
  } catch (error) {
    next(error);
  }
};


export const viewCandidateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const { candidateId } = req.params as { candidateId: string };
    let resolvedCandidateId = candidateId;

    const { queryOne: qOne } = await import("../config/db");

    const candidateById = await qOne<{ id: string }>(
      `SELECT id FROM users WHERE id = $1 AND role = 'candidate' LIMIT 1`,
      [candidateId]
    );

    if (!candidateById) {
      const appLookup = await qOne<{ candidate_id: string }>(
        `SELECT candidate_id FROM applications WHERE id = $1 LIMIT 1`,
        [candidateId]
      );

      if (!appLookup?.candidate_id) {
        throw new AppError("Candidate not found", 404);
      }

      resolvedCandidateId = appLookup.candidate_id;
    }

    const profile = await candidateService.getFullProfile(resolvedCandidateId);

    // Log profile view
    const { query: q } = await import("../config/db");
    await q(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.userId,
        "profile_viewed",
        "user",
        resolvedCandidateId,
        JSON.stringify({ candidate_id: resolvedCandidateId }),
      ]
    );

    sendSuccess(res, 200, "Candidate profile fetched", profile);
  } catch (error) {
    next(error);
  }
};