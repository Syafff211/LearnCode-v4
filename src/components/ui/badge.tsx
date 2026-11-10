import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.06em]",
  {
    variants: {
      variant: {
        neutral: "border-line-strong bg-surface-2 text-ink-soft",
        accent: "border-transparent bg-accent-soft text-accent-text",
        success: "border-transparent bg-ok-soft text-ok",
        warning: "border-transparent bg-highlight-soft text-highlight",
        danger: "border-transparent bg-danger-soft text-danger",
        outline: "border-line-strong bg-transparent text-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
