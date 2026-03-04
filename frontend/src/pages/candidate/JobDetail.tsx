import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MatchScoreBadge from "@/components/shared/MatchScoreBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { jobsApi } from "@/api/jobs.api";
import { applicationsApi } from "@/api/applications.api";
import { aiApi } from "@/api/ai.api";
import { resumeApi } from "@/api/resume.api";
import { formatSalary, timeAgo, cn, getMatchColor, getMatchBg } from "@/lib/utils";
import { toast } from "sonner";
import {
  MapPin,
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Loader2,
  FileText,
  Heart,
  HeartOff,
  ArrowLeft,
} from "lucide-react";
import type { Job, JobSkill } from "@/types";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [skills, setSkills] = useState<JobSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchScore, setMatchScore] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("30");
  const [selectedResume, setSelectedResume] = useState("");
  const [resumes, setResumes] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const res = await jobsApi.getById(id!);
      if (res.data) {
        setJob(res.data.job);
        setSkills(res.data.skills || []);
      }

      // Check if already applied
      if (isAuthenticated && user?.role === "candidate") {
        const appliedRes = await applicationsApi.checkApplied(id!);
        setHasApplied(appliedRes.data?.has_applied || false);

        // Load match score
        try {
          const matchRes = await aiApi.getMatchScore(id!);
          if (matchRes.data) setMatchScore(matchRes.data);
        } catch {
          // ignore - no skills
        }

        // Load resumes
        const resumesRes = await resumeApi.getMyResumes();
        if (resumesRes.data) {
          setResumes(Array.isArray(resumesRes.data) ? resumesRes.data : []);
        }
      }
    } catch {
      toast.error("Failed to load job details");
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to apply");
      return;
    }
    if (user?.role !== "candidate") {
      toast.error("Only candidates can apply for jobs");
      return;
    }
    if (hasApplied) {
      toast.error("You have already applied for this job");
      return;
    }

    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    setSubmitting(true);
    try {
      await jobsApi.apply(id!, {
        cover_letter: coverLetter || undefined,
        expected_salary: expectedSalary ? parseInt(expectedSalary) : undefined,
        notice_period_days: parseInt(noticePeriod),
        resume_mongo_id: selectedResume || undefined,
      });
      toast.success("Application submitted successfully!");
      setShowApplyModal(false);
      setHasApplied(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to save jobs");
      return;
    }
    try {
      if (isSaved) {
        await jobsApi.unsave(id!);
        toast.success("Job removed from saved");
      } else {
        await jobsApi.save(id!);
        toast.success("Job saved!");
      }
      setIsSaved(!isSaved);
    } catch {
      toast.error("Failed to save job");
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading job details..." />;
  if (!job) return null;

  const jobTypeColors: Record<string, string> = {
    "full-time": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "part-time": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    contract: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    internship: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {job.title}
                  </h1>
                  <p className="mt-1 text-lg text-muted-foreground">{job.company}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Badge variant="outline" className={cn("text-xs", jobTypeColors[job.job_type])}>
                      {job.job_type.replace("-", " ")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {job.workplace_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {job.experience_level.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isAuthenticated && user?.role === "candidate" && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-10 w-10",
                        isSaved && "text-red-500 hover:text-red-600"
                      )}
                      onClick={handleSave}
                    >
                      <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
                    </Button>
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={handleApply}
                      disabled={hasApplied}
                    >
                      {hasApplied ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Applied
                        </>
                      ) : (
                        "Apply Now"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Match Score */}
            {matchScore && (
              <div className={cn(
                "mt-6 rounded-lg border p-4",
                getMatchBg(matchScore.overallScore)
              )}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Your Match Score</p>
                    <p className={cn("text-2xl font-bold", getMatchColor(matchScore.overallScore))}>
                      {matchScore.overallScore}%
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Skills Match</p>
                      <p className="text-sm font-semibold">{matchScore.skillsScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Experience Match</p>
                      <p className="text-sm font-semibold">{matchScore.experienceScore}%</p>
                    </div>
                  </div>
                </div>

                {/* Skills analysis */}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {matchScore.matchedSkills?.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        You have: {matchScore.matchedSkills.join(", ")}
                      </p>
                    </div>
                  )}
                  {matchScore.missingSkills?.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 text-xs font-medium text-orange-500">
                        <AlertCircle className="h-3 w-3" />
                        Missing: {matchScore.missingSkills.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                {matchScore.analysis && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {matchScore.analysis}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">Job Details</h2>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      Posted {timeAgo(job.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {job.applications_count || 0} applicants
                    </span>
                  </div>

                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">Compensation</h2>
                {job.salary_min && job.salary_max ? (
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatSalary(job.salary_min)} - {formatSalary(job.salary_max)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      per year • {job.salary_currency}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Not disclosed</p>
                )}

                {job.benefits && job.benefits.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Benefits</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.benefits.map((benefit) => (
                        <Badge key={benefit} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">Required Skills</h2>
                <div className="mt-3 space-y-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.skill_name}
                      className="flex items-center justify-between rounded-lg border border-border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium">{skill.skill_name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {skill.min_years}+ years {skill.is_required ? "(Required)" : "(Nice to have)"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">Experience Required</h2>
                <p className="mt-2 text-lg font-semibold">
                  {job.min_experience_years} - {job.max_experience_years} years
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Level: {job.experience_level.replace("-", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground">Job Description</h2>
            <div className="mt-3 prose prose-sm max-w-none dark:prose-invert">
              {job.description.split("\n").map((para, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Apply Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
            <DialogDescription>
              Submit your application to {job.company}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Resume selection */}
            <div className="space-y-2">
              <Label>Select Resume</Label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.originalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {resumes.length === 0 && "No resumes found. Upload one first."}
              </p>
            </div>

            {/* Cover letter */}
            <div className="space-y-2">
              <Label>Cover Letter (optional)</Label>
              <Textarea
                placeholder="Tell them why you're a great fit..."
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            {/* Expected salary */}
            <div className="space-y-2">
              <Label>Expected Salary (PKR Lakhs, optional)</Label>
              <Input
                type="number"
                placeholder="e.g. 15 for PKR 15L"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
              />
            </div>

            {/* Notice period */}
            <div className="space-y-2">
              <Label>Notice Period (days)</Label>
              <Select value={noticePeriod} onValueChange={setNoticePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Immediate</SelectItem>
                  <SelectItem value="15">15 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="45">45 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitApplication} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}