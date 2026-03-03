import { forwardRef, ComponentProps } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface AccessibleButtonProps extends ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(({ children, loading, loadingText, disabled, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        loading && "cursor-wait",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText || "Loading..."}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
});

AccessibleButton.displayName = "AccessibleButton";