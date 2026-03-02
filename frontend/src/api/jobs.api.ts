import api from "./axios";
import type { ApiResponse, Job, JobSkill } from "@/types";

export const jobsApi = {
  search: async (params: Record<string, any> = {}) => {
    const res = await api.get<ApiResponse<Job[]>>("/jobs", { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<{ job: Job; skills: JobSkill[] }>>(
      `/jobs/${id}`
    );
    return res.data;
  },

  create: async (data: any) => {
    const res = await api.post<ApiResponse<{ job: Job; skills: JobSkill[] }>>(
      "/jobs",
      data
    );
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<Job>>(`/jobs/${id}`, data);
    return res.data;
  },

  close: async (id: string) => {
    const res = await api.patch<ApiResponse<Job>>(`/jobs/${id}/close`);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse>(`/jobs/${id}`);
    return res.data;
  },

  getMyJobs: async (params: Record<string, any> = {}) => {
    const res = await api.get<ApiResponse<Job[]>>("/jobs/my-jobs", { params });
    return res.data;
  },

  save: async (id: string) => {
    const res = await api.post<ApiResponse>(`/jobs/${id}/save`);
    return res.data;
  },

  unsave: async (id: string) => {
    const res = await api.delete<ApiResponse>(`/jobs/${id}/save`);
    return res.data;
  },

  getSaved: async (params: Record<string, any> = {}) => {
    const res = await api.get<ApiResponse<Job[]>>("/jobs/saved", { params });
    return res.data;
  },

  apply: async (jobId: string, data: any) => {
    const res = await api.post<ApiResponse>(`/jobs/${jobId}/apply`, data);
    return res.data;
  },
};