import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import MatchScoreBadge from "@/components/shared/MatchScoreBadge";
import Pagination from "@/components/shared/Pagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationsApi } from "@/api/applications.api";
import { timeAgo, formatSalary } from "@/lib/utils";
import { toast } from "sonner";
import {
  ClipboardList,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import type { Application } from "@/types";

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadApps();
  }, [page, statusFilter]);

  const loadApps = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit: 10, sort_by: "applied_at", sort_order: "desc" };
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await applicationsApi.getMine(params);
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

  const handleWithdraw = async (appId: string) => {
    if (!confirm("Withdraw this application?")) return;
    try {
      await applicationsApi.withdraw(appId);
      toast.success("Application withdrawn");
      loadApps();
    } catch {
      toast.error("Failed to withdraw");
    }
  };

  return (
    <DashboardLayout
      title="My Applications"
      subtitle={`${total} application${total !== 1 ? "s" : ""} total`}
      actions={
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="offered">Offered</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {loading ? (
        <LoadingSpinner fullScreen text="Loading applications..." />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications found"
          description={statusFilter !== "all" ? "Try a different filter" : "Start applying to jobs!"}
          actionLabel="Browse Jobs"
          onAction={() => (window.location.href = "/jobs")}
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <div>
                            <Link to={`/jobs/${app.job_id}`} className="text-sm font-semibold text-foreground hover:text-primary hover:underline">
                              {app.job_title}
                            </Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {app.job_company}
                              </span>
                              {app.job_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {app.job_location}
                                </span>
                              )}
                              <span>Applied {timeAgo(app.applied_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {app.ai_match_score && (
                          <MatchScoreBadge score={app.ai_match_score} size="sm" />
                        )}
                        <StatusBadge status={app.status} />
                        {!["hired", "rejected", "withdrawn"].includes(app.status) && (
                          <Button variant="ghost" size="sm" className="text-xs text-destructive h-7" onClick={() => handleWithdraw(app.id)}>
                            Withdraw
                          </Button>
                        )}
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
    </DashboardLayout>
  );
}