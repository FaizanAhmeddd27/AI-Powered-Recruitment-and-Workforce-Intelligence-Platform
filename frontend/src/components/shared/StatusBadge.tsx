import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium border px-2 py-0.5",
        getStatusColor(status),
        className
      )}
    >
      {label}
    </Badge>
  );
}