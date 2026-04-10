import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate active-elevate-2" ,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-2xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-2xs",
        success: "border-transparent bg-success/8 text-success",
        warning: "border-transparent bg-warning/8 text-warning",
        info: "border-transparent bg-info/8 text-info",
        outline: " border [border-color:var(--badge-outline)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
