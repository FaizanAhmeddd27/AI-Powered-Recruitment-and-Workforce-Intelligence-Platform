import { queryOne, queryMany, query } from "../config/db";
import { IOffer } from "../models/types/interview.types";
import logger from "../utils/logger.utils";

export const createOffer = async (data: {
  application_id: string;
  salary_offered: number;
  joining_date: Date;
  benefits?: string;
  offer_letter_url?: string;
  expiry_date?: Date;
}): Promise<IOffer> => {
  const application = await queryOne<{
    job_id: string;
    candidate_id: string;
    recruiter_id: string;
  }>(
    `SELECT a.job_id, a.candidate_id, j.recruiter_id
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = $1`,
    [data.application_id]
  );

  if (!application) {
    throw new Error("Application not found for offer creation");
  }

  // Default expiry to 7 days from now if not provided
  const expiryDate = data.expiry_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const benefitsArray = data.benefits
    ? data.benefits
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const offer = await queryOne<IOffer>(
    `INSERT INTO offers
     (application_id, job_id, recruiter_id, candidate_id, salary_offered, joining_date, benefits, offer_letter_url, offer_expiry_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
     RETURNING *`,
    [
      data.application_id,
      application.job_id,
      application.recruiter_id,
      application.candidate_id,
      data.salary_offered,
      data.joining_date,
      benefitsArray,
      data.offer_letter_url || null,
      expiryDate,
    ]
  );

  if (!offer) {
    throw new Error("Failed to create offer");
  }

  logger.info(`Offer created for application ${data.application_id}`);
  return offer;
};

export const getOffer = async (offerId: string): Promise<IOffer> => {
  const offer = await queryOne<IOffer>(
    `SELECT * FROM offers WHERE id = $1`,
    [offerId]
  );

  if (!offer) {
    throw new Error("Offer not found");
  }

  return offer;
};

export const getApplicationOffer = async (applicationId: string): Promise<IOffer | null> => {
  const offer = await queryOne<IOffer>(
    `SELECT * FROM offers WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [applicationId]
  );

  return offer || null;
};

export const acceptOffer = async (offerId: string): Promise<IOffer> => {
  const offer = await queryOne<IOffer>(
    `SELECT * FROM offers WHERE id = $1`,
    [offerId]
  );

  if (!offer) {
    throw new Error("Offer not found");
  }

  if (offer.status !== "pending") {
    throw new Error(`Cannot accept offer with status: ${offer.status}`);
  }

  if (new Date(offer.offer_expiry_date) < new Date()) {
    throw new Error("Offer has expired");
  }

  const updatedOffer = await queryOne<IOffer>(
    `UPDATE offers 
     SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [offerId]
  );

  if (!updatedOffer) {
    throw new Error("Failed to accept offer");
  }

  logger.info(`Offer ${offerId} accepted`);
  return updatedOffer;
};

export const declineOffer = async (
  offerId: string,
  reason?: string,
  feedback?: string
): Promise<IOffer> => {
  const offer = await queryOne<IOffer>(
    `SELECT * FROM offers WHERE id = $1`,
    [offerId]
  );

  if (!offer) {
    throw new Error("Offer not found");
  }

  if (offer.status !== "pending") {
    throw new Error(`Cannot decline offer with status: ${offer.status}`);
  }

  const updatedOffer = await queryOne<IOffer>(
    `UPDATE offers 
     SET status = 'declined', 
         decline_reason = $1, 
         decline_feedback = $2,
         declined_at = NOW(),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [reason || null, feedback || null, offerId]
  );

  if (!updatedOffer) {
    throw new Error("Failed to decline offer");
  }

  logger.info(`Offer ${offerId} declined`);
  return updatedOffer;
};

export const checkExpiredOffers = async (): Promise<IOffer[]> => {
  // Find all pending offers that have expired
  const expiredOffers = await queryMany<IOffer>(
    `SELECT * FROM offers 
     WHERE status = 'pending' 
     AND offer_expiry_date < NOW()`,
    []
  );

  // Mark them as expired
  if (expiredOffers.length > 0) {
    await query(
      `UPDATE offers 
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'pending' AND offer_expiry_date < NOW()`,
      []
    );

    logger.info(`${expiredOffers.length} offers marked as expired`);
  }

  return expiredOffers;
};

export const rescindOffer = async (
  offerId: string,
  reason: string
): Promise<IOffer> => {
  const offer = await queryOne<IOffer>(
    `SELECT * FROM offers WHERE id = $1`,
    [offerId]
  );

  if (!offer) {
    throw new Error("Offer not found");
  }

  // Can only rescind pending offers
  if (offer.status !== "pending") {
    throw new Error(`Cannot rescind offer with status: ${offer.status}`);
  }

  const updatedOffer = await queryOne<IOffer>(
    `UPDATE offers 
     SET status = 'rescinded', 
         decline_reason = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [reason, offerId]
  );

  if (!updatedOffer) {
    throw new Error("Failed to rescind offer");
  }

  logger.info(`Offer ${offerId} rescinded`);
  return updatedOffer;
};

export const updateOffer = async (
  offerId: string,
  data: Partial<{
    salary_offered: number;
    joining_date: Date;
    benefits: string;
    offer_letter_url: string;
    offer_expiry_date: Date;
  }>
): Promise<IOffer> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.salary_offered !== undefined) {
    updates.push(`salary_offered = $${paramCount++}`);
    values.push(data.salary_offered);
  }
  if (data.joining_date) {
    updates.push(`joining_date = $${paramCount++}`);
    values.push(data.joining_date);
  }
  if (data.benefits) {
    updates.push(`benefits = $${paramCount++}`);
    values.push(data.benefits);
  }
  if (data.offer_letter_url) {
    updates.push(`offer_letter_url = $${paramCount++}`);
    values.push(data.offer_letter_url);
  }
  if (data.offer_expiry_date) {
    updates.push(`offer_expiry_date = $${paramCount++}`);
    values.push(data.offer_expiry_date);
  }

  if (updates.length === 0) {
    throw new Error("No fields to update");
  }

  updates.push(`updated_at = NOW()`);
  values.push(offerId);

  const offer = await queryOne<IOffer>(
    `UPDATE offers SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (!offer) {
    throw new Error("Offer not found");
  }

  logger.info(`Offer ${offerId} updated`);
  return offer;
};

export const getOffersByStatus = async (
  status: string,
  limit: number = 50
): Promise<IOffer[]> => {
  const offers = await queryMany<IOffer>(
    `SELECT * FROM offers WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
    [status, limit]
  );

  return offers;
};

export const getRecruiterOffers = async (
  jobId: string,
  limit: number = 20
): Promise<IOffer[]> => {
  const offers = await queryMany<IOffer>(
    `SELECT o.*, u.full_name as candidate_name, j.title as job_title
     FROM offers o
     JOIN applications a ON o.application_id = a.id
     JOIN users u ON u.id = o.candidate_id
     JOIN jobs j ON j.id = o.job_id
     WHERE a.job_id = $1
     ORDER BY o.created_at DESC
     LIMIT $2`,
    [jobId, limit]
  );

  return offers;
};

export const getCandidateOffers = async (
  candidateId: string
): Promise<IOffer[]> => {
  const offers = await queryMany<IOffer>(
    `SELECT o.*, j.title as job_title
     FROM offers o
     JOIN applications a ON o.application_id = a.id
     JOIN jobs j ON j.id = o.job_id
     WHERE a.candidate_id = $1
     ORDER BY o.created_at DESC`,
    [candidateId]
  );

  return offers;
};
