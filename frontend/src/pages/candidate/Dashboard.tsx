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
} from "lucide-react";
import type { Application, JobRecommendation } from "@/types";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, appsRes] = await Promise.allSettled([
        applicationsApi.getCandidateStats(),
        applicationsApi.getMine({ limit: 5, sort_by: "applied_at", sort_order: "desc" }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.data)
        setStats(statsRes.value.data);
      if (appsRes.status === "fulfilled" && appsRes.value.data)
        setApplications(appsRes.value.data);

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
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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