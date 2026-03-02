import api from "./axios";
import type { ApiResponse, PlatformStats } from "@/types";

export const adminApi = {
  getStats: async () => {
    const res = await api.get<ApiResponse<PlatformStats>>("/admin/stats");
    return res.data;
  },

  getAnalytics: async () => {
    const res = await api.get<ApiResponse>("/admin/analytics");
    return res.data;
  },

  getHealth: async () => {
    const res = await api.get<ApiResponse>("/admin/health");
    return res.data;
  },

  getUsers: async (params: Record<string, any> = {}) => {
    const res = await api.get<ApiResponse>("/admin/users", { params });
    return res.data;
  },

  getUserDetail: async (userId: string) => {
    const res = await api.get<ApiResponse>(`/admin/users/${userId}`);
    return res.data;
  },

  toggleUser: async (userId: string, isActive: boolean) => {
    const res = await api.patch<ApiResponse>(
      `/admin/users/${userId}/toggle`,
      { is_active: isActive }
    );
    return res.data;
  },

  getActivity: async (limit: number = 20) => {
    const res = await api.get<ApiResponse>("/admin/activity", {
      params: { limit },
    });
    return res.data;
  },
};