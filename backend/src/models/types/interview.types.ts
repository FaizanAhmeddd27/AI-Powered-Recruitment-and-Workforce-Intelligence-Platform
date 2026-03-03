export type InterviewType = "technical" | "hr" | "managerial" | "final";
export type InterviewStatus = "scheduled" | "completed" | "rescheduled" | "cancelled";
export type OfferStatus = "pending" | "accepted" | "declined" | "expired" | "rescinded";
export type NotificationType = 
  | "application_under_review"
  | "application_shortlisted"
  | "application_rejected"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_received"
  | "offer_accepted"
  | "offer_declined"
  | "offer_expired"
  | "application_withdrawn";

export interface IInterview {
  id: string;
  application_id: string;
  job_id: string;
  recruiter_id: string;
  candidate_id: string;
  interview_type: InterviewType;
  round_number: number;
  scheduled_at: Date;
  duration_minutes: number;
  interviewer_id?: string;
  meeting_link?: string;
  meeting_type?: string;
  meeting_location?: string;
  feedback_text?: string;
  rating?: number;
  interviewer_notes?: string;
  status: InterviewStatus;
  reminder_sent_24h: boolean;
  reminder_sent_1h: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IOffer {
  id: string;
  application_id: string;
  job_id: string;
  recruiter_id: string;
  candidate_id: string;
  salary_offered: number;
  salary_currency: string;
  benefits: string[];
  joining_date: Date;
  offer_letter_url?: string;
  offer_expiry_date: Date;
  status: OfferStatus;
  decline_reason?: string;
  decline_feedback?: string;
  created_at: Date;
  accepted_at?: Date;
  declined_at?: Date;
  updated_at: Date;
}

export interface INotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  is_sent: boolean;
  created_at: Date;
  read_at?: Date;
}

export interface IInterviewFeedback {
  id: string;
  interview_id: string;
  technical_score?: number;
  communication_score?: number;
  culture_fit_score?: number;
  strengths?: string;
  areas_for_improvement?: string;
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  created_at: Date;
  updated_at: Date;
}
