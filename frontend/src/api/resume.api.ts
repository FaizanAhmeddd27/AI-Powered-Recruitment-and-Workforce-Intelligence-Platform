import api from "./axios";
import type { ApiResponse, ParsedResume } from "@/types";

export const resumeApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    const res = await api.post<ApiResponse>("/resume/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  uploadAndParse: async (file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    const res = await api.post<
      ApiResponse<{ resume: any; parsedData: any; confidence: any }>
    >("/resume/upload-and-parse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return res.data;
  },

  parse: async (resumeId: string) => {
    const res = await api.post<ApiResponse>(`/resume/parse/${resumeId}`);
    return res.data;
  },

  getStatus: async (resumeId: string) => {
    const res = await api.get<ApiResponse<{ status: string }>>(
      `/resume/status/${resumeId}`
    );
    return res.data;
  },

  getParsed: async () => {
    const res = await api.get<ApiResponse<ParsedResume>>("/resume/parsed");
    return res.data;
  },

  getMyResumes: async () => {
    const res = await api.get<ApiResponse>("/resume/my-resumes");
    return res.data;
  },

  download: async (resumeId: string) => {
    const res = await api.get(`/resume/download/${resumeId}`, {
      responseType: "blob",
    });
    return res.data;
  },

  delete: async (resumeId: string) => {
    const res = await api.delete<ApiResponse>(`/resume/${resumeId}`);
    return res.data;
  },

  getCandidateResume: async (candidateId: string) => {
    const res = await api.get<ApiResponse<ParsedResume>>(
      `/resume/candidate/${candidateId}`
    );
    return res.data;
  },
};