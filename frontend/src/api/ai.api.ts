import api from "./axios";
import type { ApiResponse, MatchScore, JobRecommendation } from "@/types";

export const aiApi = {
  getMatchScore: async (jobId: string) => {
    const res = await api.get<ApiResponse<MatchScore>>(
      `/ai/match/${jobId}`
    );
    return res.data;
  },

  getDetailedMatch: async (jobId: string) => {
    const res = await api.get<ApiResponse>(`/ai/detailed-match/${jobId}`);
    return res.data;
  },

  getRecommendations: async (limit: number = 10) => {
    const res = await api.get<ApiResponse<JobRecommendation[]>>(
      "/ai/recommendations",
      { params: { limit } }
    );
    return res.data;
  },

  generateDescription: async (data: {
    title: string;
    company: string;
    department?: string;
    skills: string[];
    experienceLevel: string;
    location: string;
  }) => {
    const res = await api.post<ApiResponse<{ description: string }>>(
      "/ai/generate-description",
      data
    );
    return res.data;
  },

  rankCandidates: async (jobId: string) => {
    const res = await api.get<ApiResponse>(`/ai/rank/${jobId}`);
    return res.data;
  },
};