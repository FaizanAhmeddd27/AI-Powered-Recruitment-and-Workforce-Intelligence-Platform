import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

export default function Logo({
  size = "md",
  showText = true,
  className,
  linkTo = "/",
}: LogoProps) {
  const sizeConfig = {
    sm: { icon: "h-7 w-7 text-sm", text: "text-base" },
    md: { icon: "h-9 w-9 text-base", text: "text-xl" },
    lg: { icon: "h-12 w-12 text-lg", text: "text-2xl" },
  };

  const config = sizeConfig[size];

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <motion.div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-md",
          config.icon
        )}
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
      >
        AI
      </motion.div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn("font-bold tracking-tight text-foreground", config.text)}
          >
            RecruitAI
          </span>
          {size !== "sm" && (
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
              Smart Hiring
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="outline-none">
        {content}
      </Link>
    );
  }

  return content;
}