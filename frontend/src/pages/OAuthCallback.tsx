import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);
  const { completeOAuthLogin } = useAuth();

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

      const processedKey = `oauth_processed_${token}`;
      if (sessionStorage.getItem(processedKey) === "1") {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            const paths: Record<string, string> = {
              candidate: "/candidate/dashboard",
              recruiter: "/recruiter/dashboard",
              admin: "/admin/dashboard",
            };
            navigate(paths[user?.role] || "/candidate/dashboard", {
              replace: true,
            });
            return;
          } catch {
            // continue to fallback below
          }
        }

        navigate("/login", { replace: true });
        return;
      }
      sessionStorage.setItem(processedKey, "1");

      try {
        // Ensure token is available for authApi.getMe interceptor/header
        localStorage.setItem("accessToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // Fetch user data
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          const user = response.data.user;
          completeOAuthLogin({
            user,
            accessToken: token,
            refreshToken: refreshToken || undefined,
          });

          // Store welcome message for after redirect
          const userName = user.full_name?.trim() || "there";
          const welcomeMessage = isNew 
            ? `Welcome to AI Recruit, ${userName}!`
            : `Welcome back, ${userName}!`;
          localStorage.setItem("welcomeMessage", welcomeMessage);

          // Navigate to dashboard without full page reload
          const paths: Record<string, string> = {
            candidate: "/candidate/dashboard",
            recruiter: "/recruiter/dashboard",
            admin: "/admin/dashboard",
          };

          const targetPath = paths[user.role] || "/candidate/dashboard";
          navigate(targetPath, { replace: true });

          setTimeout(() => {
            if (window.location.pathname === "/oauth/callback") {
              window.location.replace(targetPath);
            }
          }, 300);
        } else {
          throw new Error("Invalid user data");
        }
      } catch (error) {
        sessionStorage.removeItem(processedKey);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        toast.error("Failed to complete authentication");
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return <LoadingSpinner fullScreen text="Completing sign in..." />;
}