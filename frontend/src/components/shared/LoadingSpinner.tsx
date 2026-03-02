import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  text,
  className,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
  };

  const spinner = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <div
          className={cn(
            "animate-spin rounded-full border-muted",
            sizeClasses[size]
          )}
          style={{ borderTopColor: "var(--primary)" }}
        />
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border-transparent",
            sizeClasses[size]
          )}
          style={{ borderRightColor: "var(--primary)", opacity: 0.3 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}