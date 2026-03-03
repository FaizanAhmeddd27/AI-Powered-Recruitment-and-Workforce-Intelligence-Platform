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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recruiterApi } from "@/api/recruiter.api";
import { applicationsApi } from "@/api/applications.api";
import { interviewAPI } from "@/api/interview.api";
import { offerAPI } from "@/api/offer.api";
import { formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import {
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  BarChart3,
  Calendar,
  Gift,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RecruiterDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    const intervalId = setInterval(() => {
      loadDashboard(true);
    }, 10000);

    const handleFocus = () => {
      loadDashboard(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const loadDashboard = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const [dashRes, interviewRes] = await Promise.allSettled([
        recruiterApi.getDashboard(),
        interviewAPI.getUpcomingInterviews(10),
      ]);

      let activeJobs: any[] = [];
      let latestRecentApps: any[] = [];

      if (dashRes.status === "fulfilled") {
        const payload = (dashRes.value as any)?.data;
        const dashboardData = payload?.data || payload || {};

        setStats(dashboardData?.stats || null);
        latestRecentApps = dashboardData?.recentApplications || [];
        setRecentApps(latestRecentApps);
        setTrend(dashboardData?.applicationTrend || []);
        activeJobs = dashboardData?.activeJobs || [];
      }

      let resolvedInterviews: any[] = [];
      if (interviewRes.status === "fulfilled") {
        const payload = (interviewRes.value as any)?.data;
        const items = payload?.data || payload || [];
        resolvedInterviews = Array.isArray(items) ? items : [];
      }

      if (resolvedInterviews.length === 0 && latestRecentApps.length > 0) {
        resolvedInterviews = latestRecentApps
          .filter((app: any) => app.status === "interview")
          .map((app: any) => ({
            id: `fallback-interview-${app.id}`,
            status: "scheduled",
            candidate_name: app.candidate_name,
            job_title: app.job_title,
            scheduled_at: null,
            is_fallback: true,
          }));
      }

      setInterviews(resolvedInterviews.slice(0, 10));

      let resolvedOffers: any[] = [];
      if (activeJobs.length > 0) {
        const offerResponses = await Promise.allSettled(
          activeJobs.slice(0, 10).map((job: any) =>
            offerAPI.getRecruiterOffers(job.id, 10)
          )
        );

        const offerItems = offerResponses
          .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
          .flatMap((result) => {
            const payload = result.value?.data;
            const items = payload?.data || payload || [];
            return Array.isArray(items) ? items : [];
          });

        const uniqueOffers = Array.from(
          new Map(offerItems.map((offer: any) => [offer.id, offer])).values()
        );

        resolvedOffers = uniqueOffers;
      }

      if (resolvedOffers.length === 0 && latestRecentApps.length > 0) {
        resolvedOffers = latestRecentApps
          .filter((app: any) => app.status === "offered")
          .map((app: any) => ({
            id: `fallback-offer-${app.id}`,
            status: "pending",
            candidate_name: app.candidate_name,
            job_title: app.job_title,
            offer_expiry_date: null,
            salary_offered: null,
            is_fallback: true,
          }));
      }

      setOffers(resolvedOffers.slice(0, 20));
    } catch {
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
      title="Recruiter Dashboard"
      subtitle="Manage your job postings and applicants"
      actions={
        <Button asChild className="gap-2">
          <Link to="/recruiter/post-job">
            <PlusCircle className="h-4 w-4" />
            Post New Job
          </Link>
        </Button>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Active Jobs"
          value={stats?.active_jobs || 0}
          icon={Briefcase}
          color="blue"
          delay={0}
          trend={{
            value: 12,
            isPositive: true
          }}
        />
        <StatsCard
          title="Total Applications"
          value={stats?.total_applications || 0}
          icon={Users}
          color="green"
          delay={0.1}
          subtitle={`${stats?.pending_applications || 0} pending`}
        />
        <StatsCard
          title="Shortlisted"
          value={stats?.shortlisted || 0}
          icon={CheckCircle}
          color="purple"
          delay={0.2}
        />
        <StatsCard
          title="Avg. Match Score"
          value={`${stats?.avg_match_score || 0}%`}
          icon={TrendingUp}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Charts & Tables */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Application Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Application Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => formatDate(date).slice(0, 6)}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="url(#appGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Pipeline Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{stats?.pending_applications || 0}</span>
                <div className="h-2 w-16 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-yellow-500"
                    style={{
                      width: `${((stats?.pending_applications || 0) / (stats?.total_applications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Shortlisted</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{stats?.shortlisted || 0}</span>
                <div className="h-2 w-16 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{
                      width: `${((stats?.shortlisted || 0) / (stats?.total_applications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interview</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{stats?.in_interview || 0}</span>
                <div className="h-2 w-16 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-purple-500"
                    style={{
                      width: `${((stats?.in_interview || 0) / (stats?.total_applications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hired</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{stats?.hired || 0}</span>
                <div className="h-2 w-16 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${((stats?.hired || 0) / (stats?.total_applications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rejected</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{stats?.rejected || 0}</span>
                <div className="h-2 w-16 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{
                      width: `${((stats?.rejected || 0) / (stats?.total_applications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interviews & Offers Overview */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Active Interviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-4 w-4 text-blue-500" />
              Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming interviews
              </p>
            ) : (
              <div className="space-y-3">
                {interviews.slice(0, 5).map((interview: any) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {interview.candidate_name || "Candidate"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {interview.job_title || "Interview"}
                    </p>
                    {interview.scheduled_at && (
                      <p className="text-xs text-blue-600 font-semibold mt-1">
                        {new Date(interview.scheduled_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {interview.is_fallback && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Interview stage reached (schedule details pending)
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Offers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Gift className="h-4 w-4 text-amber-500" />
              Pending Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending offers
              </p>
            ) : (
              <div className="space-y-3">
                {offers
                  .filter((o: any) => o.status === "pending")
                  .slice(0, 5)
                  .map((offer: any) => {
                    const expiryDate = new Date(offer.offer_expiry_date);
                    const daysLeft = Math.ceil(
                      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-border p-3 space-y-1"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {offer.candidate_name || "Candidate"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {offer.job_title || "Offer"}
                        </p>
                        {offer.salary_offered && (
                          <p className="text-xs text-green-600 font-semibold">
                            ₹{Number(offer.salary_offered).toLocaleString("en-IN")}
                          </p>
                        )}
                        {daysLeft > 0 && (
                          <p className="text-xs text-amber-600">
                            Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                          </p>
                        )}
                        {offer.is_fallback && (
                          <p className="text-xs text-muted-foreground">
                            Offered stage reached (offer details pending)
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offers Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-primary" />
              Offers Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-sm font-semibold">
                {offers.filter((o: any) => o.status === "pending").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accepted</span>
              <span className="text-sm font-semibold text-green-600">
                {offers.filter((o: any) => o.status === "accepted").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Declined</span>
              <span className="text-sm font-semibold text-red-600">
                {offers.filter((o: any) => o.status === "declined").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expired</span>
              <span className="text-sm font-semibold text-gray-600">
                {offers.filter((o: any) => o.status === "expired").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/recruiter/my-jobs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No applications yet"
                description="Applications will appear here when candidates apply"
                actionLabel="Post a Job"
                onAction={() => (window.location.href = "/recruiter/post-job")}
              />
            ) : (
              <div className="space-y-3">
                {recentApps.map((app, i) => {
                  return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {app.candidate_name}
                        </p>
                        <MatchScoreBadge score={app.ai_match_score} size="sm" />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.job_title} • {timeAgo(app.applied_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={app.status} />
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}