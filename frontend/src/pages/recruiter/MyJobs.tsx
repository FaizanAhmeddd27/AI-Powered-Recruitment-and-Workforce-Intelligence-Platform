import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { jobsApi } from "@/api/jobs.api";
import { timeAgo, formatSalary } from "@/lib/utils";
import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  Users,
  Eye,
  Clock,
  MoreVertical,
  Edit,
  XCircle,
  EyeOff,
  PlusCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await jobsApi.getMyJobs({ page: 1, limit: 20 });
      if (res.data) setJobs(res.data);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async (jobId: string) => {
    if (!confirm("Close this job? It will no longer accept applications.")) return;
    try {
      await jobsApi.close(jobId);
      toast.success("Job closed");
      loadJobs();
    } catch {
      toast.error("Failed to close job");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Delete this job? This action cannot be undone.")) return;
    try {
      await jobsApi.delete(jobId);
      toast.success("Job deleted");
      loadJobs();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading your jobs..." />;

  return (
    <DashboardLayout
      title="My Jobs"
      subtitle="Manage your job postings"
      actions={
        <Button asChild className="gap-2">
          <Link to="/recruiter/post-job">
            <PlusCircle className="h-4 w-4" />
            Post New Job
          </Link>
        </Button>
      }
    >
      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs posted yet"
          description="Start by creating your first job posting"
          actionLabel="Post a Job"
          onAction={() => (window.location.href = "/recruiter/post-job")}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-base font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {job.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo(job.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {job.applications_count || 0} applicants
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {job.views_count || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={job.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {job.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/recruiter/jobs/${job.id}/applications`}>
                            Applications
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/recruiter/jobs/${job.id}/ranked`}>
                            AI Rank
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/recruiter/edit-job/${job.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {job.status === "active" && (
                              <DropdownMenuItem onClick={() => handleCloseJob(job.id)}>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Close
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}