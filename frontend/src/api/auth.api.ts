import api from "./axios";
import type { ApiResponse, User, LoginPayload, SignupPayload } from "@/types";

export const authApi = {
  signup: async (data: SignupPayload) => {
    const res = await api.post<
      ApiResponse<{ user: User; accessToken: string; refreshToken: string }>
    >("/auth/signup", data);
    return res.data;
  },

  login: async (data: LoginPayload) => {
    const res = await api.post<
      ApiResponse<{ user: User; accessToken: string; refreshToken: string }>
    >("/auth/login", data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<{ user: User }>>("/auth/me");
    return res.data;
  },

  logout: async () => {
    const res = await api.post<ApiResponse>("/auth/logout");
    return res.data;
  },

  refreshToken: async (refreshToken: string) => {
    const res = await api.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >("/auth/refresh", { refreshToken });
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    const res = await api.post<ApiResponse>("/auth/change-password", data);
    return res.data;
  },

  getGoogleAuthUrl: () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return `${baseUrl}/auth/google`;
  },

  getGithubAuthUrl: () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return `${baseUrl}/auth/github`;
  },
};