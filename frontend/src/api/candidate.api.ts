import api from "./axios";
import type { ApiResponse, FullCandidateProfile, CandidateSkill, CandidateExperience, CandidateEducation } from "@/types";

export const candidateApi = {
  getProfile: async () => {
    const res = await api.get<ApiResponse<FullCandidateProfile>>(
      "/candidate/profile"
    );
    return res.data;
  },

  updateProfile: async (data: any) => {
    const res = await api.put<ApiResponse>("/candidate/profile", data);
    return res.data;
  },

  updateDetails: async (data: any) => {
    const res = await api.put<ApiResponse>("/candidate/details", data);
    return res.data;
  },

  getSkills: async () => {
    const res = await api.get<ApiResponse<CandidateSkill[]>>(
      "/candidate/skills"
    );
    return res.data;
  },

  addSkill: async (data: {
    skill_name: string;
    years_of_experience: number;
    proficiency_level: string;
  }) => {
    const res = await api.post<ApiResponse<CandidateSkill>>(
      "/candidate/skills",
      data
    );
    return res.data;
  },

  updateSkill: async (skillId: string, data: any) => {
    const res = await api.put<ApiResponse<CandidateSkill>>(
      `/candidate/skills/${skillId}`,
      data
    );
    return res.data;
  },

  deleteSkill: async (skillId: string) => {
    const res = await api.delete<ApiResponse>(`/candidate/skills/${skillId}`);
    return res.data;
  },

  addExperience: async (data: any) => {
    const res = await api.post<ApiResponse<CandidateExperience>>(
      "/candidate/experience",
      data
    );
    return res.data;
  },

  updateExperience: async (expId: string, data: any) => {
    const res = await api.put<ApiResponse<CandidateExperience>>(
      `/candidate/experience/${expId}`,
      data
    );
    return res.data;
  },

  deleteExperience: async (expId: string) => {
    const res = await api.delete<ApiResponse>(
      `/candidate/experience/${expId}`
    );
    return res.data;
  },

  addEducation: async (data: any) => {
    const res = await api.post<ApiResponse<CandidateEducation>>(
      "/candidate/education",
      data
    );
    return res.data;
  },

  updateEducation: async (eduId: string, data: any) => {
    const res = await api.put<ApiResponse<CandidateEducation>>(
      `/candidate/education/${eduId}`,
      data
    );
    return res.data;
  },

  deleteEducation: async (eduId: string) => {
    const res = await api.delete<ApiResponse>(
      `/candidate/education/${eduId}`
    );
    return res.data;
  },
};