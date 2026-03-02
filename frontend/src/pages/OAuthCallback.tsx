import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const isNew = searchParams.get("isNew") === "true";
      const error = searchParams.get("error");

      if (error) {
        toast.error(decodeURIComponent(error));
        navigate("/login", { replace: true });
        return;
      }

      if (!token) {
        toast.error("Authentication failed. No token received.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        // Save tokens first
        localStorage.setItem("accessToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // Fetch user data
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          const user = response.data.user;
          localStorage.setItem("user", JSON.stringify(user));

          // Store welcome message for after redirect
          const welcomeMessage = isNew 
            ? `Welcome to AI Recruit, ${user.full_name}!`
            : `Welcome back, ${user.full_name}!`;
          localStorage.setItem("welcomeMessage", welcomeMessage);

          // Navigate to dashboard with full page reload to trigger auth state update
          const paths: Record<string, string> = {
            candidate: "/candidate/dashboard",
            recruiter: "/recruiter/dashboard",
          };
          
          // Use window.location to force a full reload and auth state initialization
          window.location.href = paths[user.role] || "/candidate/dashboard";
        } else {
          throw new Error("Invalid user data");
        }
      } catch (error) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        toast.error("Failed to complete authentication");
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Empty - redirect happens immediately */}
    </div>
  );
}