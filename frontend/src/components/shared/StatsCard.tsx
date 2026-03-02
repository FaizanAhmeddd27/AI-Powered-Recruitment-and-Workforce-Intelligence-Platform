import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: "primary" | "green" | "blue" | "orange" | "purple" | "red";
  className?: string;
  delay?: number;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "primary",
  className,
  delay = 0,
}: StatsCardProps) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              <span className="text-muted-foreground font-normal">vs last week</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
            colorMap[color]
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </motion.div>
  );
}
