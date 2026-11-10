import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  label?: string;
  tone?: "accent" | "success";
}

export function Progress({ value, className, label, tone = "accent" }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label ?? "Progress"}
      className={cn("h-[3px] w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tone === "success" ? "bg-ok" : "bg-accent",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
