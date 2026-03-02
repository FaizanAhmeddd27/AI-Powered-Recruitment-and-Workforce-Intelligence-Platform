import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  ClipboardList,
  Sparkles,
  PlusCircle,
  FolderOpen,
  Users,
  BarChart3,
  Activity,
  Heart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

const navByRole: Record<UserRole, NavItem[]> = {
  candidate: [
    { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
    { label: "My Profile", href: "/candidate/profile", icon: User },
    { label: "Resume", href: "/candidate/resume", icon: FileText },
    { label: "Browse Jobs", href: "/jobs", icon: Briefcase },
    { label: "Applications", href: "/candidate/applications", icon: ClipboardList },
    { label: "AI Picks", href: "/candidate/recommendations", icon: Sparkles },
  ],
  recruiter: [
    { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
    { label: "Post Job", href: "/recruiter/post-job", icon: PlusCircle },
    { label: "My Jobs", href: "/recruiter/my-jobs", icon: FolderOpen },
    { label: "Browse Jobs", href: "/jobs", icon: Briefcase },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "System Health", href: "/admin/system-health", icon: Activity },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = navByRole[user.role] || [];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border px-4 h-16",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && <Logo size="sm" linkTo="/" />}
        {collapsed && (
          <Link
            to="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
          >
            AI
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 flex-shrink-0",
                  isActive ? "text-sidebar-primary" : ""
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <ThemeToggle className={cn(collapsed ? "mx-auto" : "")} />

        {/* User info */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg p-2",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-primary/10 text-sidebar-primary text-xs font-semibold">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {user.full_name}
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">
                {user.email}
              </p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full text-destructive hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "px-2" : "justify-start gap-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex lg:flex-col",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Header Bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4 lg:hidden">
        <Logo size="sm" linkTo="/" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-sidebar-border bg-sidebar lg:hidden"
            >
              <div className="absolute right-2 top-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}