import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import LoadingSpinner from "./LoadingSpinner";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const paths: Record<UserRole, string> = {
      candidate: "/candidate/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin/dashboard",
    };
    return <Navigate to={paths[user.role]} replace />;
  }

  return <>{children}</>;
}