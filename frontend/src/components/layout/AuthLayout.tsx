import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import AuthImageSlider from "@/components/auth/AuthImageSlider";
import { Button } from "@/components/ui/button";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left side — Image Slider (hidden on mobile) */}
      <div className="hidden w-1/2 lg:block">
        <AuthImageSlider />
      </div>

      {/* Right side — Form */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
            </Link>
          </div>
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}