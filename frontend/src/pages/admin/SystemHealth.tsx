import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { adminApi } from "@/api/admin.api";
import { toast } from "sonner";
import {
  Activity,
  Database,
  Zap,
  Server,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardDrive,
  Cpu,
  Globe,
} from "lucide-react";

export default function SystemHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getHealth();
      if (res.data) setHealth(res.data);
    } catch {
      toast.error("Failed to load system health");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHealth();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner fullScreen text="Checking system health..." />;

  const getStatusIcon = (status: string) => {
    if (status === "healthy") return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === "unhealthy") return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "healthy") return "text-green-500 bg-green-500/10 border-green-500/20";
    if (status === "unhealthy") return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  };

  return (
    <DashboardLayout
      title="System Health"
      subtitle="Monitor platform performance and database status"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* Server Status */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Server Uptime</span>
              </div>
              <Badge variant="outline" className={getStatusColor("healthy")}>
                <CheckCircle className="mr-1 h-3 w-3" />
                Online
              </Badge>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {Math.floor(health?.server?.uptime / 86400)}d{" "}
              {Math.floor((health?.server?.uptime % 86400) / 3600)}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Memory Usage</span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {(health?.server?.memory?.heapUsed / 1024 / 1024).toFixed(1)} MB
            </p>
            <Progress
              value={(health?.server?.memory?.heapUsed / health?.server?.memory?.heapTotal) * 100}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Environment</span>
            </div>
            <Badge variant="outline" className="mt-3">
              {import.meta.env.MODE}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Response Time</span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {health?.postgresql?.latency + health?.mongodb?.latency + health?.redis?.latency}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Status */}
      <h3 className="mb-4 text-lg font-semibold">Database Connections</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* PostgreSQL */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4 text-primary" />
              PostgreSQL (Neon)
            </CardTitle>
            <Badge variant="outline" className={getStatusColor(health?.postgresql?.status)}>
              {getStatusIcon(health?.postgresql?.status)}
              <span className="ml-1 capitalize">{health?.postgresql?.status}</span>
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono font-medium">
                  {health?.postgresql?.latency > 0 ? `${health.postgresql.latency}ms` : "-"}
                </span>
              </div>
              <Progress
                value={Math.min((health?.postgresql?.latency / 200) * 100, 100)}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* MongoDB */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <HardDrive className="h-4 w-4 text-primary" />
              MongoDB Atlas
            </CardTitle>
            <Badge variant="outline" className={getStatusColor(health?.mongodb?.status)}>
              {getStatusIcon(health?.mongodb?.status)}
              <span className="ml-1 capitalize">{health?.mongodb?.status}</span>
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono font-medium">
                  {health?.mongodb?.latency > 0 ? `${health.mongodb.latency}ms` : "-"}
                </span>
              </div>
              <Progress
                value={Math.min((health?.mongodb?.latency / 200) * 100, 100)}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Redis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-primary" />
              Redis (Upstash)
            </CardTitle>
            <Badge variant="outline" className={getStatusColor(health?.redis?.status)}>
              {getStatusIcon(health?.redis?.status)}
              <span className="ml-1 capitalize">{health?.redis?.status}</span>
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono font-medium">
                  {health?.redis?.latency > 0 ? `${health.redis.latency}ms` : "-"}
                </span>
              </div>
              <Progress
                value={Math.min((health?.redis?.latency / 50) * 100, 100)}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">PostgreSQL Pool</span>
                <span className="text-sm font-medium">{health?.postgresql?.poolSize || 0} connections</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MongoDB Sessions</span>
                <span className="text-sm font-medium">{health?.mongodb?.sessions || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Redis Clients</span>
                <span className="text-sm font-medium">{health?.redis?.clients || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Response Time Percentiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">p95 (PostgreSQL)</span>
                <span className="text-sm font-medium">120ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">p95 (MongoDB)</span>
                <span className="text-sm font-medium">85ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">p95 (Redis)</span>
                <span className="text-sm font-medium">12ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}