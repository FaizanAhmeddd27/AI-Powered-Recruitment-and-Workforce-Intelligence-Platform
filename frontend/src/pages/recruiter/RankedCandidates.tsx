import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MatchScoreBadge from "@/components/shared/MatchScoreBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiApi } from "@/api/ai.api";
import { getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronLeft,
  Sparkles,
  MapPin,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Eye,
  Award,
  TrendingUp,
  Users,
} from "lucide-react";

export default function RankedCandidates() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [ranked, setRanked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, [jobId]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const res = await aiApi.rankCandidates(jobId!);
      if (res.data) setRanked(res.data);
    } catch {
      toast.error("Failed to load candidate rankings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="AI is ranking candidates..." />;

  const topCandidates = ranked.filter((c) => c.rank <= 3);
  const restCandidates = ranked.filter((c) => c.rank > 3);

  return (
    <DashboardLayout
      title="AI-Ranked Candidates"
      subtitle="Candidates ranked by AI match score"
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      }
    >
      {/* Top 3 Podium */}
      {topCandidates.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Award className="h-4 w-4 text-primary" />
            Top Candidates
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.candidateId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative rounded-xl border-2 p-5",
                  index === 0
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                    : index === 1
                    ? "border-gray-400 bg-gray-50 dark:bg-gray-900/30"
                    : "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                )}
              >
                <div
                  className={cn(
                    "absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white",
                    index === 0
                      ? "bg-yellow-400"
                      : index === 1
                      ? "bg-gray-400"
                      : "bg-orange-400"
                  )}
                >
                  #{candidate.rank}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={candidate.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-bold">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.headline}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <MatchScoreBadge score={candidate.matchScore} size="lg" />
                  <Button size="sm" asChild>
                    <Link to={`/recruiter/candidate/${candidate.candidateId}`}>
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {candidate.experience} yrs
                  </Badge>
                  {candidate.location && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {candidate.location}
                    </Badge>
                  )}
                </div>

                {/* Skills breakdown */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="font-medium">Matched:</span>
                    <span className="text-muted-foreground">
                      {candidate.matchedSkills?.slice(0, 3).join(", ")}
                      {candidate.matchedSkills?.length > 3 && " + more"}
                    </span>
                  </div>
                  {candidate.missingSkills?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <AlertCircle className="h-3 w-3 text-orange-500" />
                      <span className="font-medium">Missing:</span>
                      <span className="text-muted-foreground">
                        {candidate.missingSkills.slice(0, 2).join(", ")}
                        {candidate.missingSkills.length > 2 && " + more"}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Ranked Candidates */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          All Ranked Candidates
        </h3>
        <div className="space-y-2">
          {restCandidates.map((candidate, i) => (
            <motion.div
              key={candidate.candidateId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="transition-colors hover:bg-accent/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      #{candidate.rank}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={candidate.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{candidate.name}</p>
                        <MatchScoreBadge score={candidate.matchScore} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {candidate.headline} • {candidate.experience} yrs exp
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/recruiter/candidate/${candidate.candidateId}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}