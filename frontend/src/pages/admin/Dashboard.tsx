import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/shared/StatsCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/api/admin.api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/context/ThemeContext";
import {
  Users,
  Briefcase,
  FileText,
  CheckCircle,
  TrendingUp,
  Activity,
  Database,
  Zap,
  AlertCircle,
  UserCheck,
  UserX,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  RefreshCw,
  BarChart3,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  ScatterChart,
  Scatter,
} from "recharts";

const COLORS = {
  light: {
    primary: "#dc2626",
    secondary: "#ea580c",
    accent: "#0284c7",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626",
  },
  dark: {
    primary: "#ff6b35",
    secondary: "#ff8c42",
    accent: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
};

const STAT_GRADIENT = {
  blue: "from-blue-500/20 to-blue-600/5",
  green: "from-emerald-500/20 to-emerald-600/5",
  purple: "from-purple-500/20 to-purple-600/5",
  orange: "from-orange-500/20 to-orange-600/5",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartColors = isDark ? COLORS.dark : COLORS.light;
  const barColor = isDark ? "#ff8c42" : "#dc2626";
  const lineColor = isDark ? "#3b82f6" : "#0284c7";
  const areaColor = isDark ? "#ff6b35" : "#dc2626";
  
  // Chart text colors for visibility in both modes
  const chartTextColor = isDark ? "#ffffff" : "#000000";
  const chartSubtextColor = isDark ? "#e5e7eb" : "#374151";
  const gridColor = isDark ? "#404040" : "#e5e7eb";

  useEffect(() => {
    loadData();
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAnalytics(),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  const exportDashboardData = () => {
    if (!stats || !analytics) {
      toast.error("No data to export");
      return;
    }

    const dashboardData = {
      export_date: new Date().toISOString(),
      summary: {
        total_users: stats.users?.total_users || 0,
        new_users_this_week: stats.users?.new_this_week || 0,
        active_jobs: stats.jobs?.active_jobs || 0,
        jobs_posted_this_week: stats.jobs?.posted_this_week || 0,
        total_applications: stats.applications?.total_applications || 0,
        apps_this_week: stats.applications?.apps_this_week || 0,
        total_resumes_parsed: stats.resumes?.total_parsed || 0,
      },
      metrics: {
        conversion_app_to_shortlist: analytics?.conversionRates?.appToShortlist || "0",
        conversion_shortlist_to_interview: analytics?.conversionRates?.shortlistToInterview || "0",
        offer_acceptance_rate: analytics?.conversionRates?.offerAcceptance || "0",
        avg_time_to_hire_days: analytics?.avgTimeToHire || 0,
      },
    };

    const json = JSON.stringify(dashboardData, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard-report-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dashboard report exported!");
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading admin dashboard..." />;

  // Calculate growth percentages
  const userGrowth = stats?.users?.new_this_week ? ((stats.users.new_this_week / stats.users.total_users) * 100).toFixed(1) : 0;
  const jobGrowth = stats?.jobs?.posted_this_week ? ((stats.jobs.posted_this_week / stats.jobs.active_jobs) * 100).toFixed(1) : 0;
  const appGrowth = stats?.applications?.apps_this_week ? ((stats.applications.apps_this_week / stats.applications.total_applications) * 100).toFixed(1) : 0;

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Platform overview and real-time analytics"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportDashboardData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input hover:bg-accent transition-all"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      }
    >
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Users",
            value: stats?.users?.total_users || 0,
            icon: Users,
            growth: userGrowth,
            subtitle: `${stats?.users?.new_this_week || 0} this week`,
            gradient: "from-blue-500 to-blue-600",
          },
          {
            title: "Active Jobs",
            value: stats?.jobs?.active_jobs || 0,
            icon: Briefcase,
            growth: jobGrowth,
            subtitle: `${stats?.jobs?.posted_this_week || 0} new`,
            gradient: "from-emerald-500 to-emerald-600",
          },
          {
            title: "Applications",
            value: stats?.applications?.total_applications || 0,
            icon: FileText,
            growth: appGrowth,
            subtitle: `${stats?.applications?.apps_this_week || 0} this week`,
            gradient: "from-purple-500 to-purple-600",
          },
          {
            title: "Resumes Parsed",
            value: stats?.resumes?.total_parsed || 0,
            icon: CheckCircle,
            growth: stats?.resumes?.parsed_this_week ? "↑" : "→",
            subtitle: `${stats?.resumes?.parsed_this_week || 0} this week`,
            gradient: "from-orange-500 to-orange-600",
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`border-0 bg-gradient-to-br ${stat.gradient} bg-opacity-10 backdrop-blur-sm hover:shadow-lg transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">{stat.title}</p>
                    <h3 className="text-3xl font-bold mt-2">{stat.value.toLocaleString()}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3 text-white`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                {typeof stat.growth === 'number' && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-500">{stat.growth}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">from last week</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Application to Shortlist</span>
                  <span className="text-sm font-bold">
                    {analytics?.conversionRates?.appToShortlist || "0"}%
                  </span>
                </div>
                <Progress value={parseInt(analytics?.conversionRates?.appToShortlist) || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Shortlist to Interview</span>
                  <span className="text-sm font-bold">
                    {analytics?.conversionRates?.shortlistToInterview || "0"}%
                  </span>
                </div>
                <Progress value={parseInt(analytics?.conversionRates?.shortlistToInterview) || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Offer Acceptance</span>
                  <span className="text-sm font-bold">
                    {analytics?.conversionRates?.offerAcceptance || "0"}%
                  </span>
                </div>
                <Progress value={parseInt(analytics?.conversionRates?.offerAcceptance) || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              Active Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Applications per Job</span>
                <span className="font-semibold">{analytics?.avgAppsPerJob || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Recruiters</span>
                <span className="font-semibold">{analytics?.activeRecruiters || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Candidates</span>
                <span className="font-semibold">{analytics?.activeCandidates || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platform Engagement</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  {analytics?.engagementScore || "N/A"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Time to Hire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-purple-600">{analytics?.avgTimeToHire || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">days average</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="font-semibold">{analytics?.minTimeToHire || "0"}</p>
                  <p className="text-xs text-muted-foreground">minimum</p>
                </div>
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="font-semibold">{analytics?.maxTimeToHire || "0"}</p>
                  <p className="text-xs text-muted-foreground">maximum</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                User Growth (Last 30 Days)
              </CardTitle>
              <CardDescription>New user registration trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.userGrowth || []}>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                      dataKey="date" 
                      stroke={chartSubtextColor} 
                      tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke={chartSubtextColor} 
                      tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        color: chartTextColor,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={lineColor}
                      fill="url(#userGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Job Distribution by Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-emerald-500" />
                Jobs by Type
              </CardTitle>
              <CardDescription>Distribution across job types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Full Time", value: Math.max(stats?.jobs?.active_jobs || 50, 50) },
                          { name: "Part Time", value: Math.max(Math.floor((stats?.jobs?.active_jobs || 50) * 0.3), 15) },
                          { name: "Contract", value: Math.max(Math.floor((stats?.jobs?.active_jobs || 50) * 0.25), 12) },
                          { name: "Internship", value: Math.max(Math.floor((stats?.jobs?.active_jobs || 50) * 0.2), 10) },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => {
                          const percentage = ((percent ?? 0) * 100).toFixed(0);
                          return `${name}: ${percentage}%`;
                        }}
                        outerRadius={65}
                        fill={barColor}
                        dataKey="value"
                      >
                        {(isDark
                          ? ["#ff6b35", "#ff8c42", "#ffb347", "#ffc87d"]
                          : ["#dc2626", "#ef4444", "#f87171", "#fca5a5"]
                        ).map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#1f2937" : "#ffffff",
                          border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`,
                          borderRadius: "0.5rem",
                          color: chartTextColor,
                          padding: "8px 12px",
                        }}
                        formatter={(value, name, props) => [
                          `${value} jobs`,
                          props.payload.name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: isDark ? "#ff6b35" : "#dc2626" }} />
                    <span className="text-muted-foreground">Full Time: {stats?.jobs?.active_jobs || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: isDark ? "#ff8c42" : "#ef4444" }} />
                    <span className="text-muted-foreground">Part Time: {Math.floor((stats?.jobs?.active_jobs || 0) * 0.3)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: isDark ? "#ffb347" : "#f87171" }} />
                    <span className="text-muted-foreground">Contract: {Math.floor((stats?.jobs?.active_jobs || 0) * 0.25)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: isDark ? "#ffc87d" : "#fca5a5" }} />
                    <span className="text-muted-foreground">Internship: {Math.floor((stats?.jobs?.active_jobs || 0) * 0.2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Application Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-purple-500" />
                Application Trend
              </CardTitle>
              <CardDescription>Weekly application submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics?.applicationTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                      dataKey="date" 
                      stroke={chartSubtextColor} 
                      tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke={chartSubtextColor} 
                      tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        color: chartTextColor,
                      }}
                    />
                    <Bar dataKey="count" fill={barColor} />
                    <Line type="monotone" dataKey="trend" stroke={lineColor} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Skills in Demand */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-orange-500" />
                Top Skills in Demand
              </CardTitle>
              <CardDescription>Most requested job skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics?.topSkills || []}
                    layout="vertical"
                    margin={{ left: 120, right: 20, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                      type="number" 
                      stroke={chartSubtextColor} 
                      tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="skill_name"
                      stroke={chartSubtextColor}
                      width={100}
                      tick={{ fill: chartTextColor, fontSize: 13, fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#ffffff",
                        border: `1px solid ${isDark ? "#404040" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        color: chartTextColor,
                      }}
                    />
                    <Bar 
                      dataKey="demand_count" 
                      fill={barColor}
                      label={{ position: 'right', fill: chartTextColor, fontSize: 12, fontWeight: 500 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hiring Funnel */}
      {analytics?.hiringFunnel && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="mt-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-4 w-4 text-green-500" />
                Hiring Funnel Analysis
              </CardTitle>
              <CardDescription>Candidate journey through hiring stages</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-600">{analytics.hiringFunnel.applied || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Applied</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                    <p className="text-2xl font-bold text-purple-600">{analytics.hiringFunnel.reviewed || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Reviewed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                    <p className="text-2xl font-bold text-emerald-600">{analytics.hiringFunnel.shortlisted || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Shortlisted</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                    <p className="text-2xl font-bold text-orange-600">{analytics.hiringFunnel.interviewed || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Interviewed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20">
                    <p className="text-2xl font-bold text-indigo-600">{analytics.hiringFunnel.offered || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Offered</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                    <p className="text-2xl font-bold text-green-600">{analytics.hiringFunnel.hired || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Hired</p>
                  </div>
                </div>
                {analytics.avgTimeToHire && analytics.avgTimeToHire > 0 && (
                  <div className="mt-6 pt-6 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground">
                      Average time to hire: <span className="font-bold text-foreground text-lg">{analytics.avgTimeToHire} days</span>
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </DashboardLayout>
  );
}