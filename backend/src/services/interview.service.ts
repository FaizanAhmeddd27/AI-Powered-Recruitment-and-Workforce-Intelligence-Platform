import { queryOne, queryMany, query } from "../config/db";
import { IInterview } from "../models/types/interview.types";
import logger from "../utils/logger.utils";

export const createInterview = async (data: {
  application_id: string;
  interview_type: string;
  scheduled_at: Date;
  interviewer_id?: string;
  meeting_link?: string;
  meeting_type?: string;
  notes?: string;
}): Promise<IInterview> => {
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
    throw new Error("Application not found for interview creation");
  }

  const interview = await queryOne<IInterview>(
    `INSERT INTO interviews
     (application_id, job_id, recruiter_id, candidate_id, interview_type, scheduled_at, interviewer_id, meeting_link, meeting_type, interviewer_notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
     RETURNING *`,
    [
      data.application_id,
      application.job_id,
      application.recruiter_id,
      application.candidate_id,
      data.interview_type,
      data.scheduled_at,
      data.interviewer_id || null,
      data.meeting_link || null,
      data.meeting_type || "video_call",
      data.notes || null,
    ]
  );

  if (!interview) {
    throw new Error("Failed to create interview");
  }

  logger.info(`Interview created for application ${data.application_id}`);
  return interview;
};

export const updateInterview = async (
  interviewId: string,
  data: Partial<{
    scheduled_at: Date;
    interviewer_id: string;
    meeting_link: string;
    meeting_type: string;
    interviewer_notes: string;
    status: string;
  }>
): Promise<IInterview> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.scheduled_at) {
    updates.push(`scheduled_at = $${paramCount++}`);
    values.push(data.scheduled_at);
  }
  if (data.interviewer_id) {
    updates.push(`interviewer_id = $${paramCount++}`);
    values.push(data.interviewer_id);
  }
  if (data.meeting_link) {
    updates.push(`meeting_link = $${paramCount++}`);
    values.push(data.meeting_link);
  }
  if (data.meeting_type) {
    updates.push(`meeting_type = $${paramCount++}`);
    values.push(data.meeting_type);
  }
  if (data.interviewer_notes) {
    updates.push(`interviewer_notes = $${paramCount++}`);
    values.push(data.interviewer_notes);
  }
  if (data.status) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
  }

  if (updates.length === 0) {
    throw new Error("No fields to update");
  }

  updates.push(`updated_at = NOW()`);
  values.push(interviewId);

  const interview = await queryOne<IInterview>(
    `UPDATE interviews SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (!interview) {
    throw new Error("Interview not found");
  }

  logger.info(`Interview ${interviewId} updated`);
  return interview;
};

export const completeInterview = async (
  interviewId: string,
  feedback: {
    technical_score?: number;
    communication_score?: number;
    culture_fit_score?: number;
    recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
    notes?: string;
  }
): Promise<IInterview> => {
  // Update interview status
  const interview = await queryOne<IInterview>(
    `UPDATE interviews SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *`,
    [interviewId]
  );

  if (!interview) {
    throw new Error("Interview not found");
  }

  // Create feedback record
  if (feedback) {
    await queryOne(
      `INSERT INTO interview_feedback
       (interview_id, technical_score, communication_score, culture_fit_score, recommendation, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        interviewId,
        feedback.technical_score || null,
        feedback.communication_score || null,
        feedback.culture_fit_score || null,
        feedback.recommendation,
        feedback.notes || null,
      ]
    );
  }

  logger.info(`Interview ${interviewId} completed with feedback`);
  return interview;
};

export const getInterview = async (interviewId: string): Promise<IInterview> => {
  const interview = await queryOne<IInterview>(
    `SELECT * FROM interviews WHERE id = $1`,
    [interviewId]
  );

  if (!interview) {
    throw new Error("Interview not found");
  }

  return interview;
};

export const getApplicationInterviews = async (applicationId: string): Promise<IInterview[]> => {
  const interviews = await queryMany<IInterview>(
    `SELECT * FROM interviews WHERE application_id = $1 ORDER BY scheduled_at ASC`,
    [applicationId]
  );

  return interviews;
};

export const getUpcomingInterviews = async (
  recruiterId?: string,
  limit: number = 10
): Promise<IInterview[]> => {
  const interviews = await queryMany<IInterview>(
    recruiterId
      ? `SELECT i.*, u.full_name as candidate_name, j.title as job_title FROM interviews i
         JOIN users u ON u.id = i.candidate_id
         JOIN jobs j ON j.id = i.job_id
         WHERE (i.recruiter_id = $1 OR i.interviewer_id = $1)
           AND i.scheduled_at > NOW()
           AND i.status IN ('scheduled', 'rescheduled')
         ORDER BY i.scheduled_at ASC
         LIMIT $2`
      : `SELECT i.*, u.full_name as candidate_name, j.title as job_title FROM interviews i
         JOIN users u ON u.id = i.candidate_id
         JOIN jobs j ON j.id = i.job_id
         WHERE i.scheduled_at > NOW()
           AND i.status IN ('scheduled', 'rescheduled')
         ORDER BY i.scheduled_at ASC
         LIMIT $1`,
    recruiterId ? [recruiterId, limit] : [limit]
  );

  return interviews;
};

export const getCompletedInterviewsWithFeedback = async (
  applicationId: string
): Promise<Array<IInterview & { feedback?: any }>> => {
  const interviews = await queryMany<IInterview & { feedback?: any }>(
    `SELECT i.*, 
            json_build_object(
              'technical_score', f.technical_score,
              'communication_score', f.communication_score,
              'culture_fit_score', f.culture_fit_score,
              'recommendation', f.recommendation,
              'notes', f.notes
            ) as feedback
     FROM interviews i
     LEFT JOIN interview_feedback f ON i.id = f.interview_id
     WHERE i.application_id = $1 AND i.status = 'completed'
     ORDER BY i.completed_at DESC`,
    [applicationId]
  );

  return interviews;
};

export const rescheduleInterview = async (
  interviewId: string,
  newScheduledAt: Date,
  notes?: string
): Promise<IInterview> => {
  const interview = await queryOne<IInterview>(
    `UPDATE interviews 
     SET scheduled_at = $1, status = 'rescheduled', interviewer_notes = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [newScheduledAt, notes || null, interviewId]
  );

  if (!interview) {
    throw new Error("Interview not found");
  }

  logger.info(`Interview ${interviewId} rescheduled to ${newScheduledAt}`);
  return interview;
};

export const sendInterviewReminders = async (): Promise<void> => {
  // Send reminders for interviews in next 24 hours
  const upcomingInterviews = await queryMany<IInterview>(
    `SELECT * FROM interviews 
     WHERE scheduled_at <= NOW() + INTERVAL '24 hours'
     AND scheduled_at > NOW()
     AND status = 'scheduled'
     AND reminder_sent_24h = false`,
    []
  );

  for (const interview of upcomingInterviews) {
    // Mark reminder as sent
    await query(
      `UPDATE interviews SET reminder_sent_24h = true, updated_at = NOW() WHERE id = $1`,
      [interview.id]
    );
    // TODO: Send email reminder to candidate
    logger.info(`24h reminder sent for interview ${interview.id}`);
  }

  // Send reminders for interviews in next 1 hour
  const soonInterviews = await queryMany<IInterview>(
    `SELECT * FROM interviews 
     WHERE scheduled_at <= NOW() + INTERVAL '1 hour'
     AND scheduled_at > NOW()
     AND status = 'scheduled'
     AND reminder_sent_1h = false`,
    []
  );

  for (const interview of soonInterviews) {
    // Mark reminder as sent
    await query(
      `UPDATE interviews SET reminder_sent_1h = true, updated_at = NOW() WHERE id = $1`,
      [interview.id]
    );
    // TODO: Send email reminder to candidate
    logger.info(`1h reminder sent for interview ${interview.id}`);
  }
};

export const cancelInterview = async (
  interviewId: string,
  cancellationReason: string
): Promise<IInterview> => {
  const interview = await queryOne<IInterview>(
    `UPDATE interviews 
     SET status = 'cancelled', interviewer_notes = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [cancellationReason, interviewId]
  );

  if (!interview) {
    throw new Error("Interview not found");
  }

  logger.info(`Interview ${interviewId} cancelled`);
  return interview;
};

export const getInterviewFeedback = async (
  interviewId: string
): Promise<any> => {
  const feedback = await queryOne(
    `SELECT * FROM interview_feedback WHERE interview_id = $1`,
    [interviewId]
  );

  return feedback;
};

export const updateInterviewFeedback = async (
  interviewId: string,
  feedback: {
    technical_score?: number;
    communication_score?: number;
    culture_fit_score?: number;
    recommendation?: string;
    notes?: string;
  }
): Promise<any> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (feedback.technical_score !== undefined) {
    updates.push(`technical_score = $${paramCount++}`);
    values.push(feedback.technical_score);
  }
  if (feedback.communication_score !== undefined) {
    updates.push(`communication_score = $${paramCount++}`);
    values.push(feedback.communication_score);
  }
  if (feedback.culture_fit_score !== undefined) {
    updates.push(`culture_fit_score = $${paramCount++}`);
    values.push(feedback.culture_fit_score);
  }
  if (feedback.recommendation) {
    updates.push(`recommendation = $${paramCount++}`);
    values.push(feedback.recommendation);
  }
  if (feedback.notes) {
    updates.push(`notes = $${paramCount++}`);
    values.push(feedback.notes);
  }

  if (updates.length === 0) {
    throw new Error("No feedback fields to update");
  }

  updates.push(`updated_at = NOW()`);
  values.push(interviewId);

  const result = await queryOne(
    `UPDATE interview_feedback SET ${updates.join(", ")} WHERE interview_id = $${paramCount} RETURNING *`,
    values
  );

  if (!result) {
    throw new Error("Interview feedback not found or update failed");
  }

  logger.info(`Feedback updated for interview ${interviewId}`);
  return result;
};

export const respondToInterview = async (
  interviewId: string,
  candidateId: string,
  response: "accepted" | "declined",
  reason?: string
): Promise<IInterview> => {
  const interview = await queryOne<IInterview>(
    `SELECT * FROM interviews WHERE id = $1`,
    [interviewId]
  );

  if (!interview) {
    throw new Error("Interview not found");
  }

  if (interview.candidate_id !== candidateId) {
    throw new Error("You can only respond to your own interview");
  }

  if (!["scheduled", "rescheduled"].includes(interview.status)) {
    throw new Error(`Cannot respond to interview with status: ${interview.status}`);
  }

  const notePrefix = response === "accepted" ? "[Candidate Accepted]" : "[Candidate Declined]";
  const noteSuffix = reason ? ` ${reason}` : "";
  const nextStatus = response === "accepted" ? interview.status : "cancelled";

  const updatedInterview = await queryOne<IInterview>(
    `UPDATE interviews
     SET status = $1,
         interviewer_notes = COALESCE(interviewer_notes, '') || $2,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [nextStatus, `\n${notePrefix}${noteSuffix}`, interviewId]
  );

  if (!updatedInterview) {
    throw new Error("Failed to update interview response");
  }

  logger.info(`Interview ${interviewId} ${response} by candidate ${candidateId}`);
  return updatedInterview;
};
