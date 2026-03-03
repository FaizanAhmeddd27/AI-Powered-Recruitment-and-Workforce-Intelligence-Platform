import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { adminApi } from "@/api/admin.api";
import { getInitials, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import {
  Activity,
  UserPlus,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const actionIcons: Record<string, any> = {
  user_signup: UserPlus,
  user_login: Eye,
  user_logout: XCircle,
  job_posted: Briefcase,
  application_submitted: FileText,
  application_shortlisted: CheckCircle,
  application_hired: CheckCircle,
  application_rejected: XCircle,
  resume_parsed: Sparkles,
};

const actionColors: Record<string, string> = {
  user_signup: "text-blue-500 bg-blue-500/10",
  user_login: "text-emerald-500 bg-emerald-500/10",
  user_logout: "text-orange-500 bg-orange-500/10",
  job_posted: "text-purple-500 bg-purple-500/10",
  application_submitted: "text-indigo-500 bg-indigo-500/10",
  application_shortlisted: "text-green-500 bg-green-500/10",
  application_hired: "text-emerald-500 bg-emerald-500/10",
  application_rejected: "text-red-500 bg-red-500/10",
  resume_parsed: "text-yellow-500 bg-yellow-500/10",
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getActivity(50);
      if (res.data) setActivities(res.data);
    } catch {
      toast.error("Failed to load activity feed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const getActionText = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Platform Activity
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <AnimatePresence initial={false}>
            {activities.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = actionIcons[activity.action] || Activity;
                  const colorClass = actionColors[activity.action] || "text-muted-foreground bg-muted/50";

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={activity.user_avatar} />
                            <AvatarFallback className="text-[8px] bg-primary/10">
                              {activity.user_name ? getInitials(activity.user_name) : "SY"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-medium truncate">
                            {activity.user_name || "System"}
                          </p>
                          <Badge variant="outline" className="text-[8px] px-1 py-0">
                            {activity.user_role || "system"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {timeAgo(activity.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {getActionText(activity.action)}
                          {activity.metadata && (
                            <span className="block mt-0.5 text-[10px] text-muted-foreground/70">
                              {JSON.stringify(activity.metadata).slice(0, 60)}...
                            </span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}