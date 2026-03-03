import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/60 dark:focus-visible:ring-ring/70 dark:focus-visible:shadow-[0_0_0_3px_rgba(255,163,0,0.15)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/50 dark:border-input/60 dark:hover:bg-input/70 dark:hover:border-input/80 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow,background-color,border-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed dark:disabled:opacity-40 disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
