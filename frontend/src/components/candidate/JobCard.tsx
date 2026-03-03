import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MatchScoreBadge from "@/components/shared/MatchScoreBadge";
import { useAuth } from "@/context/AuthContext";
import { jobsApi } from "@/api/jobs.api";
import { formatSalary, timeAgo, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  MapPin,
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  Heart,
  HeartOff,
  Sparkles,
  Users,
} from "lucide-react";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
  matchScore?: number;
  showSave?: boolean;
  className?: string;
  onSaveToggle?: () => void;
}

export default function JobCard({
  job,
  matchScore,
  showSave = true,
  className,
  onSaveToggle,
}: JobCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to save jobs");
      return;
    }
    if (user?.role !== "candidate") {
      toast.error("Only candidates can save jobs");
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        await jobsApi.unsave(job.id);
        toast.success("Job removed from saved");
      } else {
        await jobsApi.save(job.id);
        toast.success("Job saved!");
      }
      setIsSaved(!isSaved);
      onSaveToggle?.();
    } catch {
      toast.error("Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const jobTypeColors: Record<string, string> = {
    "full-time": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "part-time": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    contract: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    internship: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/jobs/${job.id}`}>
        <Card className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30",
          className
        )}>
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              {/* Company logo placeholder */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>

                  {/* Match Score & Save Button */}
                  <div className="flex items-center gap-2">
                    {matchScore && (
                      <MatchScoreBadge score={matchScore} size="sm" />
                    )}
                    {showSave && isAuthenticated && user?.role === "candidate" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-full",
                          isSaved && "text-red-500 hover:text-red-600"
                        )}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <Sparkles className="h-4 w-4 animate-spin" />
                        ) : isSaved ? (
                          <Heart className="h-4 w-4 fill-current" />
                        ) : (
                          <HeartOff className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {job.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{timeAgo(job.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", jobTypeColors[job.job_type])}>
                      {job.job_type.replace("-", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Salary & Experience */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {job.salary_min && job.salary_max && (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatSalary(job.salary_min)} - {formatSalary(job.salary_max)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {job.applications_count || 0} applicants
                  </div>
                </div>

                {/* Skills chips */}
                {job.skills && job.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 4).map((skill) => (
                      <Badge
                        key={skill.skill_name}
                        variant="secondary"
                        className="text-[10px] bg-muted/50"
                      >
                        {skill.skill_name}
                        {skill.min_years > 0 && ` · ${skill.min_years}y`}
                      </Badge>
                    ))}
                    {job.skills.length > 4 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{job.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}