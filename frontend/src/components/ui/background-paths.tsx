import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function FloatingPaths({
  position,
  className,
}: {
  position: number;
  className?: string;
}) {
  const paths = Array.from({ length: 36 }, (_, index) => ({
    id: index,
    d: `M-${380 - index * 5 * position} -${189 + index * 6}C-${
      380 - index * 5 * position
    } -${189 + index * 6} -${312 - index * 5 * position} ${
      216 - index * 6
    } ${152 - index * 5 * position} ${343 - index * 6}C${
      616 - index * 5 * position
    } ${470 - index * 6} ${684 - index * 5 * position} ${875 - index * 6} ${
      684 - index * 5 * position
    } ${875 - index * 6}`,
    width: 0.5 + index * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className={cn("h-full w-full", className)}
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.02}
            initial={{ pathLength: 0.3, opacity: 0.4 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.5, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <FloatingPaths position={1} className="text-slate-500/40" />
      <FloatingPaths position={-1} className="text-slate-400/30" />
    </div>
  );
}
