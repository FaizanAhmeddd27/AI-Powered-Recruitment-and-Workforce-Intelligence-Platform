import { Button } from "@/components/ui/button";
import { authApi } from "@/api/auth.api";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";

export default function OAuthButtons() {
  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center">
        <Separator className="flex-1" />
        <span className="mx-3 text-xs text-muted-foreground uppercase">
          Or continue with
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 text-sm"
          onClick={() => (window.location.href = authApi.getGoogleAuthUrl())}
        >
          <FaGoogle className="h-4 w-4 text-red-500" />
          <span className="hidden sm:inline">Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 text-sm"
          onClick={() => (window.location.href = authApi.getGithubAuthUrl())}
        >
          <FaGithub className="h-4 w-4" />
          <span className="hidden sm:inline">GitHub</span>
        </Button>
      </div>
    </div>
  );
}