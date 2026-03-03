import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/StatusBadge";
import MatchScoreBadge from "@/components/shared/MatchScoreBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { applicationsApi } from "@/api/applications.api";
import { notificationAPI } from "@/api/notification.api";
import { interviewAPI } from "@/api/interview.api";
import { offerAPI } from "@/api/offer.api";
import { aiApi } from "@/api/ai.api";
import { formatDate, timeAgo, formatSalary } from "@/lib/utils";
import { toast } from "sonner";
import {
  ClipboardList,
  Sparkles,
  Eye,
  FileText,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Target,
  Bell,
  Calendar,
  Gift,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Application, JobRecommendation } from "@/types";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
      ),
    ]);
  };

  useEffect(() => {
    loadDashboard();

    const loadingSafetyTimer = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const intervalId = setInterval(() => {
      loadDashboard(true);
    }, 10000);

    const handleFocus = () => {
      loadDashboard(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(loadingSafetyTimer);
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const loadDashboard = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const [statsRes, appsRes, notifRes, offersRes] = await Promise.allSettled([
        withTimeout(applicationsApi.getCandidateStats(), 7000),
        withTimeout(
          applicationsApi.getMine({ limit: 20, sort_by: "applied_at", sort_order: "desc" }),
          7000
        ),
        withTimeout(notificationAPI.getNotifications(10, 0), 7000),
        withTimeout(offerAPI.getCandidateOffers(), 7000),
      ]);

      let recentApplications: Application[] = [];
      let latestNotifications: any[] = [];
      let resolvedOffers: any[] = [];

      if (statsRes.status === "fulfilled" && statsRes.value.data)
        setStats(statsRes.value.data);

      if (appsRes.status === "fulfilled" && Array.isArray(appsRes.value.data)) {
        recentApplications = appsRes.value.data;
        setApplications(recentApplications);
      }

      if (notifRes.status === "fulfilled") {
        const notifPayload = (notifRes.value as any)?.data;
        const notifItems =
          notifPayload?.data?.notifications ||
          notifPayload?.notifications ||
          [];

        if (Array.isArray(notifItems)) {
          latestNotifications = notifItems.slice(0, 5);
        }
      }

      if (latestNotifications.length > 0) {
        setNotifications(latestNotifications);
      } else if (recentApplications.length > 0) {
        const statusLabels: Record<string, string> = {
          under_review: "Under Review",
          shortlisted: "Shortlisted",
          interview: "Interview Stage",
          offered: "Offer Received",
          hired: "Hired",
          rejected: "Rejected",
        };

        const fallback = recentApplications
          .filter((app) => app.status !== "pending")
          .slice(0, 5)
          .map((app) => ({
            id: `status-${app.id}`,
            message: `${statusLabels[app.status] || app.status} • ${app.job_title || "Application"}`,
            created_at: app.updated_at || app.applied_at,
            is_read: false,
          }));

        setNotifications(fallback);
      } else {
        setNotifications([]);
      }

      if (offersRes.status === "fulfilled") {
        const offersPayload = (offersRes.value as any)?.data;
        const offerItems = offersPayload?.data || offersPayload || [];
        resolvedOffers = Array.isArray(offerItems) ? offerItems : [];
      }

      if (resolvedOffers.length === 0 && recentApplications.length > 0) {
        resolvedOffers = recentApplications
          .filter((app) => app.status === "offered")
          .map((app) => ({
            id: `offer-stage-${app.id}`,
            application_id: app.id,
            status: "pending",
            is_fallback: true,
            job_title: app.job_title,
            offer_expiry_date: null,
            salary_offered: null,
          }));
      }

      setOffers(resolvedOffers.slice(0, 5));

      if (recentApplications.length > 0) {
        const interviewStageApps = recentApplications.filter(
          (app) => app.status === "interview"
        );

        if (interviewStageApps.length > 0) {
          const fallbackInterviewItems = interviewStageApps.map((app) => ({
            id: `interview-stage-${app.id}`,
            application_id: app.id,
            status: "scheduled",
            scheduled_at: null,
            job_title: app.job_title,
            job_company: app.job_company,
          }));

          const interviewRequests = await Promise.allSettled(
            interviewStageApps.map((app) =>
              interviewAPI.getApplicationInterviews(app.id).then((response) => ({
                app,
                response,
              }))
            )
          );

          const interviewItems = interviewRequests
            .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
            .flatMap((result) => {
              const app = result.value?.app;
              const payload = result.value?.response?.data;
              const items = payload?.data || payload || [];

              if (!Array.isArray(items)) {
                return [];
              }

              return items.map((item: any) => ({
                ...item,
                job_title: app.job_title,
                job_company: app.job_company,
              }));
            });

          setInterviews(
            (interviewItems.length > 0 ? interviewItems : fallbackInterviewItems).slice(0, 5)
          );
        } else {
          setInterviews([]);
        }
      } else {
        setInterviews([]);
      }

      // Load recommendations separately (may fail if no skills)
      try {
        const recRes = await aiApi.getRecommendations(4);
        if (recRes.data && Array.isArray(recRes.data)) {
          setRecommendations(recRes.data);
        }
      } catch {
        // ignore - no skills yet
      }
    } catch (err) {
      if (!silent) {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading dashboard..." />;

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.full_name?.split(" ")[0] || "there"} 👋`}
      subtitle="Here's an overview of your job search journey"
    >
      {/* Profile Completion */}
      {user && user.profile_completion < 100 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Complete your profile to get better matches
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress
                    value={user.profile_completion}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs font-medium text-primary">
                    {user.profile_completion}%
                  </span>
                </div>
              </div>
              <Button size="sm" asChild className="shrink-0">
                <Link to="/candidate/profile">
                  Complete Profile
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Applications"
          value={stats?.total_applications || 0}
          icon={ClipboardList}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="AI Match Score"
          value={`${stats?.avg_match_score || 0}%`}
          icon={Sparkles}
          color="purple"
          delay={0.1}
        />
        <StatsCard
          title="Shortlisted"
          value={stats?.shortlisted || 0}
          icon={Target}
          color="green"
          delay={0.2}
        />
        <StatsCard
          title="Profile Views"
          value={stats?.profile_views || 0}
          icon={Eye}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Two Column Layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Recent Applications */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Applications
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/candidate/applications">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No applications yet"
                description="Start applying to jobs to track your progress here"
                actionLabel="Browse Jobs"
                onAction={() => (window.location.href = "/jobs")}
              />
            ) : (
              <div className="space-y-3">
                {applications.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {app.job_title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.job_company} • {timeAgo(app.applied_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.ai_match_score && (
                        <MatchScoreBadge
                          score={app.ai_match_score}
                          size="sm"
                          showIcon={false}
                        />
                      )}
                      <StatusBadge status={app.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommended Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Picks for You
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/candidate/recommendations">More</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No recommendations yet"
                description="Upload your resume to get AI job recommendations"
                actionLabel="Upload Resume"
                onAction={() => (window.location.href = "/candidate/resume")}
              />
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={rec.jobId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/jobs/${rec.jobId}`}
                      className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {rec.job?.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {rec.job?.company} • {rec.job?.location}
                          </p>
                        </div>
                        <MatchScoreBadge score={rec.matchScore} size="sm" />
                      </div>
                      {rec.job?.salary_min && rec.job?.salary_max && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {formatSalary(rec.job.salary_min)} -{" "}
                          {formatSalary(rec.job.salary_max)}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications, Interviews, Offers */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
            </CardTitle>
            <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
              {notifications.filter((n: any) => !n.is_read).length}
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notifications yet
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif: any) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-3 text-xs transition-colors ${
                      notif.is_read
                        ? "bg-muted/30 text-muted-foreground"
                        : "bg-primary/10 text-foreground border border-primary/20"
                    }`}
                  >
                    <p className="font-medium">{notif.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-4 w-4 text-blue-500" />
              Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No interviews scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview: any) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {interview.job_title || "Interview"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {interview.scheduled_at
                        ? new Date(interview.scheduled_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Interview stage (schedule details pending)"}
                    </p>
                    {interview.status === "completed" && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </div>
                    )}
                    {(interview.status === "scheduled" || interview.status === "rescheduled") &&
                      !interview.is_fallback && (
                        <div className="mt-2 flex gap-2 border-t border-border pt-2">
                          <Button
                            size="xs"
                            className="h-7 flex-1 text-xs"
                            onClick={async () => {
                              try {
                                await interviewAPI.respondToInterview(interview.id, {
                                  response: "accepted",
                                });
                                toast.success("Interview accepted");
                                loadDashboard();
                              } catch {
                                toast.error("Failed to accept interview");
                              }
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 flex-1 text-xs"
                            onClick={async () => {
                              try {
                                await interviewAPI.respondToInterview(interview.id, {
                                  response: "declined",
                                });
                                toast.success("Interview declined");
                                loadDashboard();
                              } catch {
                                toast.error("Failed to decline interview");
                              }
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Gift className="h-4 w-4 text-amber-500" />
              Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active offers
              </p>
            ) : (
              <div className="space-y-3">
                {offers.map((offer: any) => {
                  const expiryDateValue = offer.offer_expiry_date || offer.expiry_date;
                  const expiryDate = expiryDateValue ? new Date(expiryDateValue) : null;
                  const daysLeft = expiryDate
                    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-border p-3 space-y-2"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {offer.job_title || offer.job?.title || "Offer"}
                      </p>
                      {offer.salary_offered && (
                        <p className="text-xs text-green-600 font-semibold">
                          ₹{Number(offer.salary_offered).toLocaleString("en-IN")} / year
                        </p>
                      )}
                      {daysLeft !== null && daysLeft > 0 && (
                        <p className="text-xs text-amber-600">
                          Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                        </p>
                      )}
                      {offer.is_fallback && (
                        <p className="text-xs text-muted-foreground">
                          Offer stage reached (details pending from recruiter)
                        </p>
                      )}
                      {offer.status === "accepted" && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Accepted
                        </div>
                      )}
                      {offer.status === "declined" && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <XCircle className="h-3 w-3" />
                          Declined
                        </div>
                      )}
                      {offer.status === "pending" && !offer.is_fallback && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                          <Button
                            size="xs"
                            className="flex-1 h-7 text-xs"
                            onClick={async () => {
                              try {
                                await offerAPI.acceptOffer(offer.id);
                                toast.success("Offer accepted!");
                                loadDashboard();
                              } catch {
                                toast.error("Failed to accept offer");
                              }
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={async () => {
                              try {
                                await offerAPI.declineOffer(offer.id, {
                                  reason: "Not interested",
                                });
                                toast.success("Offer declined");
                                loadDashboard();
                              } catch {
                                toast.error("Failed to decline offer");
                              }
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Upload Resume", href: "/candidate/resume", icon: FileText, color: "text-blue-500" },
          { label: "Browse Jobs", href: "/jobs", icon: Briefcase, color: "text-emerald-500" },
          { label: "My Applications", href: "/candidate/applications", icon: ClipboardList, color: "text-purple-500" },
          { label: "AI Recommendations", href: "/candidate/recommendations", icon: Sparkles, color: "text-orange-500" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              to={action.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:shadow-md hover:border-primary/30 sm:p-5"
            >
              <Icon className={`h-6 w-6 ${action.color} transition-transform group-hover:scale-110`} />
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}