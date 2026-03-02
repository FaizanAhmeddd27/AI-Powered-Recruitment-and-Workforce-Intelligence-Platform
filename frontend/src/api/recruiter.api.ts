import api from "./axios";
import type { ApiResponse } from "@/types";

export const recruiterApi = {
  getDashboard: async () => {
    const res = await api.get<ApiResponse>("/recruiter/dashboard");
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get<ApiResponse>("/recruiter/profile");
    return res.data;
  },

  updateProfile: async (data: any) => {
    const res = await api.put<ApiResponse>("/recruiter/profile", data);
    return res.data;
  },

  getPipeline: async (jobId: string) => {
    const res = await api.get<ApiResponse>(`/recruiter/pipeline/${jobId}`);
    return res.data;
  },

  viewCandidate: async (candidateId: string) => {
    const res = await api.get<ApiResponse>(
      `/recruiter/candidate/${candidateId}`
    );
    return res.data;
  },
};