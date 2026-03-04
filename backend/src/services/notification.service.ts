import { queryOne, queryMany, query } from "../config/db";
import { INotification } from "../models/types/interview.types";
import logger from "../utils/logger.utils";

export const createNotification = async (data: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
}): Promise<INotification> => {
  const notification = await queryOne<INotification>(
    `INSERT INTO notifications 
     (user_id, type, title, message, related_entity_type, related_entity_id, is_sent)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [
      data.user_id,
      data.type,
      data.title,
      data.message,
      data.related_entity_type || null,
      data.related_entity_id || null,
    ]
  );

  if (!notification) {
    throw new Error("Failed to create notification");
  }

  logger.info(`Notification created: ${data.type} for user ${data.user_id}`);
  return notification;
};

export const getUserNotifications = async (
  userId: string,
  options?: { limit?: number; offset?: number; unreadOnly?: boolean }
): Promise<{ notifications: INotification[]; total: number }> => {
  const limit = options?.limit ?? 20;
  const offset = options?.offset || 0;

  const countResult = await queryOne<{ total: string }>(
    `SELECT COUNT(*) as total
     FROM notifications
     WHERE user_id = $1 ${options?.unreadOnly ? "AND is_read = false" : ""}`,
    [userId]
  );

  const notifications = await queryMany<INotification>(
    `SELECT * FROM notifications 
     WHERE user_id = $1 ${options?.unreadOnly ? "AND is_read = false" : ""}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return {
    notifications,
    total: parseInt(countResult?.total || "0", 10),
  };
};

export const backfillCandidateStatusNotifications = async (
  candidateId: string
): Promise<void> => {
  const rows = await queryMany<{
    application_id: string;
    status: string;
    job_title: string;
    candidate_id: string;
  }>(
    `SELECT a.id as application_id, a.status, j.title as job_title, a.candidate_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.candidate_id = $1
       AND a.status IN ('under_review', 'shortlisted', 'rejected', 'interview', 'offered', 'hired')
     ORDER BY a.updated_at DESC`,
    [candidateId]
  );

  const typeByStatus: Record<string, string> = {
    under_review: "application_under_review",
    shortlisted: "application_shortlisted",
    rejected: "application_rejected",
    interview: "interview_scheduled",
    offered: "offer_received",
    hired: "offer_accepted",
  };

  for (const item of rows) {
    const type = typeByStatus[item.status];
    if (!type) continue;

    const exists = await queryOne<{ id: string }>(
      `SELECT id
       FROM notifications
       WHERE user_id = $1
         AND related_entity_type = 'application'
         AND related_entity_id = $2
         AND type = $3
       LIMIT 1`,
      [candidateId, item.application_id, type]
    );

    if (exists) continue;

    let title = "Application Update";
    let message = `Your application for "${item.job_title}" has been updated.`;

    if (item.status === "under_review") {
      title = "Application Under Review";
      message = `Your application for "${item.job_title}" is now under review.`;
    }
    if (item.status === "shortlisted") {
      title = "🎉 Shortlisted";
      message = `Great news! You have been shortlisted for "${item.job_title}".`;
    }
    if (item.status === "rejected") {
      title = "Application Status Update";
      message = `Your application for "${item.job_title}" was not selected.`;
    }
    if (item.status === "interview") {
      title = "📅 Interview Stage";
      message = `Your application for "${item.job_title}" has moved to interview stage.`;
    }
    if (item.status === "offered") {
      title = "💼 Offer Stage";
      message = `You have received an offer update for "${item.job_title}".`;
    }
    if (item.status === "hired") {
      title = "🎉 Hired";
      message = `Congratulations! You are marked hired for "${item.job_title}".`;
    }

    await createNotification({
      user_id: candidateId,
      type,
      title,
      message,
      related_entity_type: "application",
      related_entity_id: item.application_id,
    });
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<INotification> => {
  const notification = await queryOne<INotification>(
    `UPDATE notifications 
     SET is_read = true, read_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [notificationId]
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  await query(
    `UPDATE notifications 
     SET is_read = true, read_at = NOW()
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  logger.debug(`Marked all notifications as read for user ${userId}`);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await query(`DELETE FROM notifications WHERE id = $1`, [notificationId]);
};

// Application Status Change Notifications
export const notifyApplicationUnderReview = async (
  candidateId: string,
  applicationId: string,
  jobTitle: string
): Promise<void> => {
  await createNotification({
    user_id: candidateId,
    type: "application_under_review",
    title: "Application Under Review",
    message: `Your application for "${jobTitle}" is now under review. We'll get back to you soon!`,
    related_entity_type: "application",
    related_entity_id: applicationId,
  });
};

export const notifyApplicationShortlisted = async (
  candidateId: string,
  applicationId: string,
  jobTitle: string
): Promise<void> => {
  await createNotification({
    user_id: candidateId,
    type: "application_shortlisted",
    title: "🎉 Congratulations! You're Shortlisted!",
    message: `Great news! You've been shortlisted for the "${jobTitle}" position. The next step will be an interview.`,
    related_entity_type: "application",
    related_entity_id: applicationId,
  });
};

export const notifyApplicationRejected = async (
  candidateId: string,
  applicationId: string,
  jobTitle: string,
  withFeedback: boolean = false
): Promise<void> => {
  const message = withFeedback
    ? `Thank you for your interest in "${jobTitle}". We appreciate your time and wish you success in your future endeavors.`
    : `Thank you for applying to "${jobTitle}". Unfortunately, we won't be moving forward at this time.`;

  await createNotification({
    user_id: candidateId,
    type: "application_rejected",
    title: "Application Status Update",
    message,
    related_entity_type: "application",
    related_entity_id: applicationId,
  });
};

export const notifyInterviewScheduled = async (
  candidateId: string,
  applicationId: string,
  jobTitle: string,
  scheduledAt: Date,
  meetingLink?: string
): Promise<void> => {
  const dateStr = new Date(scheduledAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await createNotification({
    user_id: candidateId,
    type: "interview_scheduled",
    title: "📅 Interview Scheduled",
    message: `Your interview for "${jobTitle}" is scheduled for ${dateStr}. ${
      meetingLink ? "You'll receive a meeting link shortly." : ""
    }`,
    related_entity_type: "application",
    related_entity_id: applicationId,
  });
};

export const notifyOfferReceived = async (
  candidateId: string,
  applicationId: string,
  jobTitle: string,
  salary: number,
  joiningDate: Date
): Promise<void> => {
  const joiningStr = new Date(joiningDate).toLocaleDateString("en-PK");

  await createNotification({
    user_id: candidateId,
    type: "offer_received",
    title: "💼 You've Received a Job Offer!",
    message: `Congratulations! You're offered the "${jobTitle}" position with a salary of PKR ${salary.toLocaleString("en-PK")}. Joining date: ${joiningStr}. Please review and respond by the offer expiry date.`,
    related_entity_type: "application",
    related_entity_id: applicationId,
  });
};

export const notifyApplicationWithdrawn = async (
  recruiterId: string,
  applicationId: string,
  candidateName: string,
  jobTitle: string,
  reason?: string
): Promise<void> => {
  const message = `${candidateName} has withdrawn their application for "${jobTitle}". ${
    reason ? `Reason: ${reason}` : ""
  }`;

  await createNotification({
    user_id: recruiterId,
    type: "application_withdrawn",
    title: "Application Withdrawn",
    message,
    related_entity_type: "application",
    related_entity_id: applicationId,
  });
};

// Recruiter notifications
export const notifyRecruiterStatusChange = async (
  recruiterId: string,
  applicationId: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string
): Promise<void> => {
  const statusMessages: Record<string, string> = {
    pending: "New application",
    under_review: "Application is under review",
    shortlisted: "Candidate shortlisted",
    interview: "Interview scheduled",
    offered: "Offer made",
    hired: "Candidate hired",
    rejected: "Candidate rejected",
    withdrawn: "Application withdrawn",
  };

  await createNotification({
    user_id: recruiterId,
    type: `application_${newStatus}`,
    title: `Application Update - ${candidateName}`,
    message: `${statusMessages[newStatus] || "Status changed"} for ${candidateName} - "${jobTitle}"`,
    related_entity_type: "application",
    related_entity_id: applicationId,
  });
};
