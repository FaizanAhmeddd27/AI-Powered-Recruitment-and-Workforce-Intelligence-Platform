import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center sm:py-16",
        className
      )}
    >
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted sm:h-20 sm:w-20"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
      </motion.div>
      <h3 className="mt-4 text-lg font-semibold text-foreground sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6" size="sm">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}