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
      try {
        const token = searchParams.get("token");
        const refreshToken = searchParams.get("refreshToken");
        const isNew = searchParams.get("isNew") === "true";
        const error = searchParams.get("error");

        if (error) {
          console.error("OAuth error from server:", decodeURIComponent(error));
          toast.error(decodeURIComponent(error));
          navigate("/login", { replace: true });
          return;
        }

        if (!token) {
          console.error("No token received from OAuth callback");
          toast.error("Authentication failed. No token received.");
          navigate("/login", { replace: true });
          return;
        }

        const processedKey = `oauth_processed_${token}`;
        if (sessionStorage.getItem(processedKey) === "1") {
          console.log("OAuth already processed, redirecting to dashboard");
          const savedUser = localStorage.getItem("user");
          if (savedUser) {
            try {
              const user = JSON.parse(savedUser);
              if (!user.role) {
                throw new Error("User role not found");
              }
              const paths: Record<string, string> = {
                candidate: "/candidate/dashboard",
                recruiter: "/recruiter/dashboard",
                admin: "/admin/dashboard",
              };
              const targetPath = paths[user.role] || paths["candidate"];
              navigate(targetPath, { replace: true });
              return;
            } catch (parseError) {
              console.error("Error parsing saved user:", parseError);
              localStorage.removeItem("user");
              localStorage.removeItem("accessToken");
            }
          }

          navigate("/login", { replace: true });
          return;
        }
        sessionStorage.setItem(processedKey, "1");

        console.log("Processing OAuth callback with token");
        
        // Ensure token is available for authApi.getMe interceptor/header
        localStorage.setItem("accessToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // Fetch user data
        console.log("Fetching user data from server");
        const response = await authApi.getMe();
        console.log("User data response:", response);
        
        if (response.success && response.data?.user) {
          const user = response.data.user;
          
          if (!user.id || !user.email || !user.role) {
            throw new Error("Invalid user data structure from server");
          }
          
          console.log("User authenticated successfully:", {
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
          });
          
          completeOAuthLogin({
            user,
            accessToken: token,
            refreshToken: refreshToken || undefined,
          });

          // Store welcome message for after redirect
          const userName = user.full_name?.trim() || user.email?.split("@")[0] || "there";
          const welcomeMessage = isNew 
            ? `Welcome to AI Recruit, ${userName}!`
            : `Welcome back, ${userName}!`;
          localStorage.setItem("welcomeMessage", welcomeMessage);
          
          console.log("Welcome message stored:", welcomeMessage);

          // Navigate to dashboard without full page reload
          const paths: Record<string, string> = {
            candidate: "/candidate/dashboard",
            recruiter: "/recruiter/dashboard",
            admin: "/admin/dashboard",
          };

          const targetPath = paths[user.role] || paths["candidate"];
          console.log("Navigating to:", targetPath);
          navigate(targetPath, { replace: true });

          // Fallback full page redirect if navigation doesn't work
          setTimeout(() => {
            if (window.location.pathname === "/oauth/callback") {
              console.log("Navigation didn't complete, forcing page redirect");
              window.location.replace(targetPath);
            }
          }, 500);
        } else {
          const errorMsg = `Invalid user data: ${JSON.stringify(response)}`;
          console.error(errorMsg);
          throw new Error("Invalid user data received from server");
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        sessionStorage.clear();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("welcomeMessage");
        
        const errorMessage = error?.message || "Failed to complete authentication";
        toast.error(errorMessage);
        
        // Give some time for the error toast to be seen
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, completeOAuthLogin]);

  return <LoadingSpinner fullScreen text="Completing sign in..." />;
}