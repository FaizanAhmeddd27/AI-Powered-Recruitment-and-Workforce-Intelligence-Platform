import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Bug, Copy } from "lucide-react";
import { toast } from "sonner";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("Error caught by boundary:", error, errorInfo);
    }
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleCopyError = () => {
    const errorText = `
Error: ${this.state.error?.message || "Unknown error"}
Stack: ${this.state.error?.stack || "No stack"}
Component Stack: ${this.state.errorInfo?.componentStack || "No component stack"}
    `.trim();
    
    navigator.clipboard.writeText(errorText);
    toast.success("Error details copied to clipboard");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-center text-xl">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                We're sorry, but an unexpected error occurred.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs font-mono text-destructive break-words">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">Stack trace</summary>
                      <pre className="mt-2 text-[10px] font-mono whitespace-pre-wrap text-muted-foreground">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex w-full gap-2">
                <Button onClick={this.handleReset} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1 gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
              {import.meta.env.DEV && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleCopyError}
                  className="gap-2 text-xs"
                >
                  <Copy className="h-3 w-3" />
                  Copy Error
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}