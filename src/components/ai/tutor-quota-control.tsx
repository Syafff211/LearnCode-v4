"use client";

import { AlertTriangle, Ban, ChevronDown, Gauge } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { getQuotaStatus } from "@/lib/ai/tutor-ui";
import { cn } from "@/lib/utils";

export function TutorQuotaControl({
  used,
  dailyLimit,
}: {
  used: number;
  dailyLimit: number;
}) {
  const quota = getQuotaStatus(used, dailyLimit);
  const isExhausted = quota.level === "exhausted";
  const isWarning = quota.level === "warning";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Detail kuota AI: ${quota.summaryText}, ${quota.remainingText}`}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-[6px] border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
            isExhausted
              ? "border-danger/40 bg-danger-soft text-danger hover:border-danger/60"
              : isWarning
                ? "border-highlight/40 bg-highlight-soft text-highlight hover:border-highlight/60"
                : "border-line bg-canvas text-ink-soft hover:border-line-strong hover:text-ink",
          )}
        >
          {isExhausted ? (
            <Ban className="size-3.5 shrink-0" aria-hidden="true" />
          ) : isWarning ? (
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Gauge className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
          )}
          <span className="tabular-nums whitespace-nowrap">
            {quota.used}/{quota.dailyLimit}
            <span className="hidden sm:inline"> pesan</span>
          </span>
          <span
            aria-hidden="true"
            className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-surface-3 md:inline-block"
          >
            <span
              className={cn(
                "block h-full rounded-full transition-[width] duration-300",
                isExhausted
                  ? "bg-danger"
                  : isWarning
                    ? "bg-highlight"
                    : "bg-accent",
              )}
              style={{ width: `${quota.percentage}%` }}
            />
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-3.5 sm:w-80">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-ink">Kuota AI Tutor Harian</p>
              <p className="mt-0.5 text-xs text-muted">{quota.summaryText}</p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                isExhausted
                  ? "bg-danger-soft text-danger"
                  : isWarning
                    ? "bg-highlight-soft text-highlight"
                    : "bg-accent-soft text-accent-text",
              )}
            >
              {quota.remainingText}
            </span>
          </div>

          <div className="space-y-1.5">
            <Progress
              value={quota.percentage}
              label="Persentase penggunaan kuota AI harian"
              className={cn(
                "h-2",
                isExhausted
                  ? "[&>div]:bg-danger"
                  : isWarning
                    ? "[&>div]:bg-highlight"
                    : undefined,
              )}
            />
            <div className="flex items-center justify-between text-xs text-muted tabular-nums">
              <span>Terpakai: {quota.used}</span>
              <span>Sisa: {quota.remaining}</span>
              <span>Batas: {quota.dailyLimit}</span>
            </div>
          </div>

          {quota.warningText ? (
            <div
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-[6px] border px-2.5 py-2 text-xs leading-relaxed",
                isExhausted
                  ? "border-danger/30 bg-danger-soft text-ink"
                  : "border-highlight/30 bg-highlight-soft text-ink",
              )}
            >
              {isExhausted ? (
                <Ban className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-highlight" aria-hidden="true" />
              )}
              <span>{quota.warningText}</span>
            </div>
          ) : null}

          <p className="border-t border-line pt-2 text-xs leading-relaxed text-muted">
            Kuota dihitung per hari mengikuti tanggal server. Riwayat percakapan tetap dapat kamu baca kapan saja.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
