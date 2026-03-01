import { Request, Response, NextFunction } from "express";
import * as candidateService from "../services/candidate.service";
import { sendSuccess } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";


export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const profile = await candidateService.getFullProfile(req.user.userId);

    sendSuccess(res, 200, "Profile fetched successfully", profile);
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

    sendSuccess(res, 200, "Profile updated successfully", result);
  } catch (error) {
    next(error);
  }
};


export const updateCandidateDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const result = await candidateService.updateCandidateProfile(
      req.user.userId,
      req.body
    );

    sendSuccess(res, 200, "Candidate details updated", result);
  } catch (error) {
    next(error);
  }
};


export const getSkills = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const skills = await candidateService.getSkills(req.user.userId);
    sendSuccess(res, 200, "Skills fetched", skills);
  } catch (error) {
    next(error);
  }
};

export const addSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const skill = await candidateService.addSkill(req.user.userId, req.body);
    sendSuccess(res, 201, "Skill added", skill);
  } catch (error) {
    next(error);
  }
};

export const updateSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const skill = await candidateService.updateSkill(
      req.user.userId,
      req.params.skillId as string,
      req.body
    );
    sendSuccess(res, 200, "Skill updated", skill);
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    await candidateService.deleteSkill(req.user.userId, req.params.skillId as string);
    sendSuccess(res, 200, "Skill deleted");
  } catch (error) {
    next(error);
  }
};


export const addExperience = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const exp = await candidateService.addExperience(req.user.userId, req.body);
    sendSuccess(res, 201, "Experience added", exp);
  } catch (error) {
    next(error);
  }
};

export const updateExperience = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const exp = await candidateService.updateExperience(
      req.user.userId,
      req.params.expId as string,
      req.body
    );
    sendSuccess(res, 200, "Experience updated", exp);
  } catch (error) {
    next(error);
  }
};

export const deleteExperience = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    await candidateService.deleteExperience(req.user.userId, req.params.expId as string);
    sendSuccess(res, 200, "Experience deleted");
  } catch (error) {
    next(error);
  }
};


export const addEducation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const edu = await candidateService.addEducation(req.user.userId, req.body);
    sendSuccess(res, 201, "Education added", edu);
  } catch (error) {
    next(error);
  }
};

export const updateEducation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    const edu = await candidateService.updateEducation(
      req.user.userId,
      req.params.eduId as string,
      req.body
    );
    sendSuccess(res, 200, "Education updated", edu);
  } catch (error) {
    next(error);
  }
};

export const deleteEducation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);
    await candidateService.deleteEducation(req.user.userId, req.params.eduId as string);
    sendSuccess(res, 200, "Education deleted");
  } catch (error) {
    next(error);
  }
};