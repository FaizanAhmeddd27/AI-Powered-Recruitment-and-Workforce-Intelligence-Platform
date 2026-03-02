import api from "./axios";
import type { ApiResponse, Application } from "@/types";

export const applicationsApi = {
  getMine: async (params: Record<string, any> = {}) => {
    const res = await api.get<ApiResponse<Application[]>>(
      "/applications/me",
      { params }
    );
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Application>>(
      `/applications/${id}`
    );
    return res.data;
  },

  getForJob: async (jobId: string, params: Record<string, any> = {}) => {
    const res = await api.get<ApiResponse<Application[]>>(
      `/applications/job/${jobId}`,
      { params }
    );
    return res.data;
  },

  checkApplied: async (jobId: string) => {
    const res = await api.get<ApiResponse<{ has_applied: boolean }>>(
      `/applications/check/${jobId}`
    );
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch<ApiResponse>(`/applications/${id}/status`, {
      status,
    });
    return res.data;
  },

  bulkUpdateStatus: async (ids: string[], status: string) => {
    const res = await api.patch<ApiResponse>("/applications/bulk-status", {
      application_ids: ids,
      status,
    });
    return res.data;
  },

  addNotes: async (id: string, notes: string) => {
    const res = await api.patch<ApiResponse>(`/applications/${id}/notes`, {
      notes,
    });
    return res.data;
  },

  withdraw: async (id: string, reason?: string) => {
    const res = await api.patch<ApiResponse>(`/applications/${id}/withdraw`, {
      reason,
    });
    return res.data;
  },

  getCandidateStats: async () => {
    const res = await api.get<ApiResponse>("/applications/stats/candidate");
    return res.data;
  },

  getRecruiterStats: async () => {
    const res = await api.get<ApiResponse>("/applications/stats/recruiter");
    return res.data;
  },

  getRecent: async (limit: number = 10) => {
    const res = await api.get<ApiResponse<Application[]>>(
      "/applications/recent",
      { params: { limit } }
    );
    return res.data;
  },
};