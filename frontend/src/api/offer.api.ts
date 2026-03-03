import api from "./axios";

export const offerAPI = {
  // Create offer
  createOffer: (applicationId: string, data: any) =>
    api.post(`/applications/${applicationId}/offers`, data),

  // Get offer for an application
  getApplicationOffer: (applicationId: string) =>
    api.get(`/applications/${applicationId}/offers`),

  // Get specific offer
  getOffer: (offerId: string) =>
    api.get(`/offers/${offerId}`),

  // Accept offer
  acceptOffer: (offerId: string) =>
    api.post(`/offers/${offerId}/accept`),

  // Decline offer
  declineOffer: (offerId: string, data: { reason?: string; feedback?: string }) =>
    api.post(`/offers/${offerId}/decline`, data),

  // Rescind offer (recruiter)
  rescindOffer: (offerId: string, data: { reason: string }) =>
    api.post(`/offers/${offerId}/rescind`, data),

  // Get candidate offers
  getCandidateOffers: () =>
    api.get(`/candidates/offers`),

  // Get recruiter offers for a job
  getRecruiterOffers: (jobId: string, limit: number = 20) =>
    api.get(`/jobs/${jobId}/offers?limit=${limit}`),

  // Check expired offers (admin)
  checkExpiredOffers: () =>
    api.post(`/offers/check-expired`),
};
