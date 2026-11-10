import * as React from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type CalloutTone = "info" | "success" | "danger" | "warning";

const toneStyles: Record<CalloutTone, string> = {
  info: "border-line-strong bg-surface-2 text-ink-soft",
  success: "border-ok/25 bg-ok-soft text-ink-soft",
  danger: "border-danger/30 bg-danger-soft text-ink-soft",
  warning: "border-highlight/30 bg-highlight-soft text-ink-soft",
};

const toneIcons = {
  info: Info,
  success: CircleCheck,
  danger: CircleAlert,
  warning: CircleAlert,
} as const;

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: CalloutTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = toneIcons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn("flex gap-3 rounded-[6px] border p-3.5 text-sm", toneStyles[tone], className)}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "success" && "text-ok",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-highlight",
        )}
        aria-hidden="true"
      />
      <div className="space-y-1">
        {title ? <p className="font-medium text-ink">{title}</p> : null}
        <div className="[&_a]:underline [&_a]:underline-offset-2">{children}</div>
      </div>
    </div>
  );
}
