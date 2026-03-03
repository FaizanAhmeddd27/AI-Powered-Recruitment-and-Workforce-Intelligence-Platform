import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/50 dark:border-input/60 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,background-color,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:opacity-40 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/60 focus-visible:ring-[3px] dark:focus-visible:ring-ring/70 dark:focus-visible:shadow-[0_0_0_3px_rgba(255,163,0,0.15)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-input/70 dark:hover:border-input/80",
        className
      )}
      {...props}
    />
  )
}

export { Input }
