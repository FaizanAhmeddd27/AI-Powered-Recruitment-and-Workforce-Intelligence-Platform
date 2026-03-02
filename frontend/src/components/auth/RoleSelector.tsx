import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { motion } from "framer-motion";
import { User, Building2 } from "lucide-react";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

const roles: { value: UserRole; label: string; desc: string; icon: any }[] = [
  {
    value: "candidate",
    label: "Candidate",
    desc: "Find your dream job",
    icon: User,
  },
  {
    value: "recruiter",
    label: "Recruiter",
    desc: "Hire top talent",
    icon: Building2,
  },
];

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {roles.map((role) => {
        const isActive = value === role.value;
        const Icon = role.icon;
        return (
          <motion.button
            key={role.value}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(role.value)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all sm:gap-1.5 sm:p-4",
              isActive
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-accent/50"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="role-indicator"
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <svg
                  className="h-4 w-4 text-primary-foreground"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                </svg>
              </motion.div>
            )}
            <Icon
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold sm:text-sm",
                isActive ? "text-primary" : "text-foreground"
              )}
            >
              {role.label}
            </span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">
              {role.desc}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}