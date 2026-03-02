import { cn } from "@/lib/utils";
import { getMatchColor, getMatchBg } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface MatchScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export default function MatchScoreBadge({
  score,
  size = "md",
  showIcon = true,
  className,
}: MatchScoreBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = { sm: 10, md: 12, lg: 14 };

  return (
    <motion.div
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        sizeClasses[size],
        getMatchBg(score),
        getMatchColor(score),
        className
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {showIcon && <Sparkles size={iconSizes[size]} />}
      {Math.round(score)}% Match
    </motion.div>
  );
}