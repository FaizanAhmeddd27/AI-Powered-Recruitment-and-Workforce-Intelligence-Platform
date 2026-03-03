import api from "./axios";

export const interviewAPI = {
  // Create interview
  createInterview: (applicationId: string, data: any) =>
    api.post(`/applications/${applicationId}/interviews`, data),

  // Get interviews for an application
  getApplicationInterviews: (applicationId: string) =>
    api.get(`/applications/${applicationId}/interviews`),

  // Get specific interview
  getInterview: (interviewId: string) =>
    api.get(`/interviews/${interviewId}`),

  // Update interview
  updateInterview: (interviewId: string, data: any) =>
    api.patch(`/interviews/${interviewId}`, data),

  // Complete interview with feedback
  completeInterview: (interviewId: string, feedback: any) =>
    api.post(`/interviews/${interviewId}/complete`, feedback),

  // Reschedule interview
  rescheduleInterview: (interviewId: string, data: { scheduled_at: string; notes?: string }) =>
    api.post(`/interviews/${interviewId}/reschedule`, data),

  // Cancel interview
  cancelInterview: (interviewId: string, data: { cancellation_reason: string }) =>
    api.post(`/interviews/${interviewId}/cancel`, data),

  // Candidate responds to interview
  respondToInterview: (
    interviewId: string,
    data: { response: "accepted" | "declined"; reason?: string }
  ) => api.post(`/interviews/${interviewId}/respond`, data),

  // Get upcoming interviews
  getUpcomingInterviews: (limit: number = 10) =>
    api.get(`/interviews/upcoming?limit=${limit}`),

  // Get interview feedback
  getInterviewFeedback: (interviewId: string) =>
    api.get(`/interviews/${interviewId}/feedback`),

  // Update interview feedback
  updateInterviewFeedback: (interviewId: string, feedback: any) =>
    api.patch(`/interviews/${interviewId}/feedback`, feedback),

  // Send reminders (admin only)
  sendReminders: () =>
    api.post(`/interviews/reminders/send`),
};
