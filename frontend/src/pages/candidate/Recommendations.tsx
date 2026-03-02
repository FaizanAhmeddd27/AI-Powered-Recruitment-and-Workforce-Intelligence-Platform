import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MatchScoreBadge from "@/components/shared/MatchScoreBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/api/ai.api";
import { formatSalary } from "@/lib/utils";
import { toast } from "sonner";
import {
  Sparkles,
  MapPin,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { JobRecommendation } from "@/types";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecs();
  }, []);

  const loadRecs = async () => {
    try {
      setLoading(true);
      const res = await aiApi.getRecommendations(20);
      if (res.data && Array.isArray(res.data)) {
        setRecommendations(res.data);
      } else {
        setRecommendations([]);
      }
    } catch {
      toast.error("Failed to load recommendations");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="AI is finding your best matches..." />;

  return (
    <DashboardLayout
      title="AI Recommendations"
      subtitle="Jobs matched to your skills and experience by AI"
    >
      {recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Upload your resume and add skills to get AI-powered job recommendations"
          actionLabel="Upload Resume"
          onAction={() => (window.location.href = "/candidate/resume")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, i) => (
            <motion.div
              key={rec.jobId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group h-full transition-shadow hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {rec.job?.title}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {rec.job?.company}
                      </p>
                    </div>
                    <MatchScoreBadge score={rec.matchScore} size="sm" />
                  </div>

                  {rec.job?.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <MapPin className="h-3 w-3" />
                      {rec.job.location}
                    </p>
                  )}

                  {rec.job?.salary_min && rec.job?.salary_max && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatSalary(rec.job.salary_min)} — {formatSalary(rec.job.salary_max)}
                    </p>
                  )}

                  {/* Matched / Missing skills */}
                  <div className="mt-3 flex-1 space-y-2">
                    {rec.matchedSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" /> Your Skills
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.matchedSkills.slice(0, 4).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                          ))}
                          {rec.matchedSkills.length > 4 && (
                            <Badge variant="outline" className="text-[10px]">+{rec.matchedSkills.length - 4}</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {rec.missingSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-orange-500 uppercase flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> To Learn
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.missingSkills.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] border-orange-300 text-orange-600 dark:text-orange-400">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button size="sm" className="mt-4 w-full gap-1" asChild>
                    <Link to={`/jobs/${rec.jobId}`}>
                      View Job <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}