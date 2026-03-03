import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import MatchScoreBadge from "@/components/shared/MatchScoreBadge";
import Pagination from "@/components/shared/Pagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { applicationsApi } from "@/api/applications.api";
import { recruiterApi } from "@/api/recruiter.api";
import { interviewAPI } from "@/api/interview.api";
import { offerAPI } from "@/api/offer.api";
import { getInitials, timeAgo, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Users,
  MapPin,
  Briefcase,
  Sparkles,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Download,
} from "lucide-react";

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "under_review", label: "Under Review", color: "bg-blue-500" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-emerald-500" },
  { value: "interview", label: "Interview", color: "bg-purple-500" },
  { value: "offered", label: "Offered", color: "bg-indigo-500" },
  { value: "hired", label: "Hired", color: "bg-green-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
];

export default function JobApplications() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("ai_match_score");
  const [pipeline, setPipeline] = useState<any>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    interview_type: "technical",
    scheduled_at: "",
    meeting_link: "",
    meeting_type: "video_call",
    notes: "",
  });

  const [offerForm, setOfferForm] = useState({
    salary_offered: "",
    joining_date: "",
    benefits: "",
    offer_letter_url: "",
    expiry_date: "",
  });

  useEffect(() => {
    loadApplications();
    loadPipeline();
  }, [jobId, page, statusFilter, sortBy]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 10,
        sort_by: sortBy,
        sort_order: sortBy === "ai_match_score" ? "desc" : "desc",
      };
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await applicationsApi.getForJob(jobId!, params);
      if (res.data) setApplications(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotal(res.meta.total || 0);
      }
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const loadPipeline = async () => {
    try {
      const res = await recruiterApi.getPipeline(jobId!);
      if (res.data) setPipeline(res.data);
    } catch {
      // ignore
    }
  };

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    const app = applications.find((item) => item.id === appId);

    if (newStatus === "interview") {
      setSelectedApp(app || null);
      setInterviewForm({
        interview_type: "technical",
        scheduled_at: "",
        meeting_link: "",
        meeting_type: "video_call",
        notes: "",
      });
      setIsInterviewModalOpen(true);
      return;
    }

    if (newStatus === "offered") {
      setSelectedApp(app || null);
      setOfferForm({
        salary_offered: "",
        joining_date: "",
        benefits: "",
        offer_letter_url: "",
        expiry_date: "",
      });
      setIsOfferModalOpen(true);
      return;
    }

    try {
      await applicationsApi.updateStatus(appId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      loadApplications();
      loadPipeline();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const submitInterviewSchedule = async () => {
    if (!selectedApp) return;

    if (!interviewForm.scheduled_at) {
      toast.error("Please select interview date and time");
      return;
    }

    try {
      setIsSubmittingAction(true);

      await interviewAPI.createInterview(selectedApp.id, {
        interview_type: interviewForm.interview_type,
        scheduled_at: interviewForm.scheduled_at,
        meeting_link: interviewForm.meeting_link || undefined,
        meeting_type: interviewForm.meeting_type,
        notes: interviewForm.notes || undefined,
      });

      await applicationsApi.updateStatus(selectedApp.id, "interview");

      toast.success("Interview scheduled successfully");
      setIsInterviewModalOpen(false);
      setSelectedApp(null);
      loadApplications();
      loadPipeline();
    } catch {
      toast.error("Failed to schedule interview");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const submitOffer = async () => {
    if (!selectedApp) return;

    if (!offerForm.salary_offered || !offerForm.joining_date) {
      toast.error("Salary and joining date are required");
      return;
    }

    try {
      setIsSubmittingAction(true);

      await offerAPI.createOffer(selectedApp.id, {
        salary_offered: Number(offerForm.salary_offered),
        joining_date: offerForm.joining_date,
        benefits: offerForm.benefits || undefined,
        offer_letter_url: offerForm.offer_letter_url || undefined,
        expiry_date: offerForm.expiry_date || undefined,
      });

      await applicationsApi.updateStatus(selectedApp.id, "offered");

      toast.success("Offer created successfully");
      setIsOfferModalOpen(false);
      setSelectedApp(null);
      loadApplications();
      loadPipeline();
    } catch {
      toast.error("Failed to create offer");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading applications..." />;

  return (
    <DashboardLayout
      title={pipeline?.jobTitle || "Applications"}
      subtitle={`${total} application${total !== 1 ? "s" : ""} for this position`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>
      }
    >
      {/* Pipeline Stats */}
      {pipeline && (
        <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-4">
          {statusOptions.map((status) => (
            <div
              key={status.value}
              className="rounded-lg border border-border bg-card p-3 text-center"
            >
              <div className={cn("h-2 w-full rounded-t-lg", status.color)} />
              <p className="mt-2 text-lg font-bold">{pipeline.pipeline[status.value] || 0}</p>
              <p className="text-xs text-muted-foreground">{status.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai_match_score">AI Match</SelectItem>
              <SelectItem value="applied_at">Date Applied</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applications yet"
          description="Applications will appear here when candidates apply"
        />
      ) : (
        <>
          <div className="space-y-3">
            {applications.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Candidate Info */}
                      <div className="flex flex-1 gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={app.candidate_avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(app.candidate_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/recruiter/candidate/${app.candidate_id}`}
                              className="text-base font-semibold text-foreground hover:text-primary hover:underline"
                            >
                              {app.candidate_name}
                            </Link>
                            <MatchScoreBadge score={app.ai_match_score} size="sm" />
                          </div>
                          <p className="text-xs text-muted-foreground">{app.candidate_email}</p>
                          {app.candidate_headline && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {app.candidate_headline}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {app.candidate_location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {app.candidate_location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {app.candidate_experience || 0} yrs exp
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Applied {timeAgo(app.applied_at)}
                            </span>
                          </div>

                          {/* Skills chips */}
                          {app.candidate_skills && app.candidate_skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {app.candidate_skills.slice(0, 5).map((skill: any) => (
                                <Badge key={skill.skill_name} variant="secondary" className="text-[10px]">
                                  {skill.skill_name} ({skill.years_of_experience}y)
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Select
                          value={app.status}
                          onValueChange={(v) => handleStatusUpdate(app.id, v)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-2 w-2 rounded-full", s.color)} />
                                  {s.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/recruiter/candidate/${app.candidate_id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-6"
          />
        </>
      )}

      <Dialog open={isInterviewModalOpen} onOpenChange={setIsInterviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Set interview details for {selectedApp?.candidate_name || "candidate"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Interview Type</Label>
              <Select
                value={interviewForm.interview_type}
                onValueChange={(v) =>
                  setInterviewForm((prev) => ({ ...prev, interview_type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="managerial">Managerial</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={interviewForm.scheduled_at}
                onChange={(e) =>
                  setInterviewForm((prev) => ({ ...prev, scheduled_at: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Meeting Link</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={interviewForm.meeting_link}
                onChange={(e) =>
                  setInterviewForm((prev) => ({ ...prev, meeting_link: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any instructions for candidate"
                value={interviewForm.notes}
                onChange={(e) =>
                  setInterviewForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInterviewModalOpen(false)}
              disabled={isSubmittingAction}
            >
              Cancel
            </Button>
            <Button onClick={submitInterviewSchedule} disabled={isSubmittingAction}>
              {isSubmittingAction ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Offer</DialogTitle>
            <DialogDescription>
              Set offer details for {selectedApp?.candidate_name || "candidate"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Salary Offered (INR)</Label>
              <Input
                type="number"
                placeholder="2500000"
                value={offerForm.salary_offered}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, salary_offered: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input
                type="date"
                value={offerForm.joining_date}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, joining_date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Benefits (comma separated)</Label>
              <Input
                placeholder="Health Insurance, Bonus, Remote"
                value={offerForm.benefits}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, benefits: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Offer Letter URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={offerForm.offer_letter_url}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, offer_letter_url: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOfferModalOpen(false)}
              disabled={isSubmittingAction}
            >
              Cancel
            </Button>
            <Button onClick={submitOffer} disabled={isSubmittingAction}>
              {isSubmittingAction ? "Creating..." : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}