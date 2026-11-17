"use client";

import * as React from "react";
import {
  BookOpen,
  Bug,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileSearch,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TUTOR_MODES,
  TUTOR_MODE_MAP,
  TUTOR_OVERFLOW_MODES,
  TUTOR_PRIMARY_MODES,
} from "@/lib/ai/tutor-ui";
import { cn } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";

const modeIcons: Record<AiAction, LucideIcon> = {
  free_chat: MessageSquare,
  explain_code: FileSearch,
  debug_code: Bug,
  hint: Lightbulb,
  code_review: ClipboardCheck,
  explain_lesson: BookOpen,
  practice_suggestions: FlaskConical,
};

type TooltipState = {
  text: string;
  leftPx: number;
};

export const TutorModeToolbar = React.memo(function TutorModeToolbar({
  mode,
  disabled,
  onModeChange,
}: {
  mode: AiAction;
  disabled: boolean;
  onModeChange: (mode: AiAction) => void;
}) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  const tooltipId = React.useId();

  const activeOverflow = React.useMemo(
    () => TUTOR_OVERFLOW_MODES.find((entry) => entry.action === mode) ?? null,
    [mode],
  );
  const OverflowIcon = activeOverflow ? modeIcons[activeOverflow.action] : null;

  const showTooltipFor = React.useCallback((el: HTMLElement, text: string) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      setTooltip({ text, leftPx: 120 });
      return;
    }
    const wrapperRect = wrapper.getBoundingClientRect();
    const targetRect = el.getBoundingClientRect();
    const center = targetRect.left - wrapperRect.left + targetRect.width / 2;
    const clamped = Math.max(88, Math.min(Math.max(88, wrapperRect.width - 88), center));
    setTooltip({ text, leftPx: clamped });
  }, []);

  const hideTooltip = React.useCallback(() => {
    setTooltip(null);
  }, []);

  React.useEffect(() => {
    if (!tooltip) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTooltip(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tooltip]);

  return (
    <div className="shrink-0 border-b border-line bg-canvas/95 px-3 py-2 sm:px-5">
      <div ref={wrapperRef} className="relative mx-auto flex max-w-3xl items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <div
            role="group"
            aria-label="Mode AI Tutor"
            onScroll={hideTooltip}
            className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pr-5"
          >
            {TUTOR_PRIMARY_MODES.map((entry) => {
              const Icon = modeIcons[entry.action];
              const isActive = mode === entry.action;
              return (
                <button
                  key={entry.action}
                  type="button"
                  onClick={() => onModeChange(entry.action)}
                  onMouseEnter={(event) => showTooltipFor(event.currentTarget, entry.description)}
                  onMouseLeave={hideTooltip}
                  onFocus={(event) => showTooltipFor(event.currentTarget, entry.description)}
                  onBlur={hideTooltip}
                  aria-pressed={isActive}
                  aria-describedby={
                    tooltip?.text === entry.description ? tooltipId : undefined
                  }
                  title={entry.description}
                  disabled={disabled}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none",
                    isActive
                      ? "border-accent bg-accent text-accent-ink shadow-xs"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{entry.label}</span>
                </button>
              );
            })}

            <DropdownMenu onOpenChange={(open) => { if (open) hideTooltip(); }}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onMouseEnter={(event) =>
                    showTooltipFor(
                      event.currentTarget,
                      activeOverflow
                        ? activeOverflow.description
                        : "Mode tambahan: Review kode dan Jelaskan lesson.",
                    )
                  }
                  onMouseLeave={hideTooltip}
                  onFocus={(event) =>
                    showTooltipFor(
                      event.currentTarget,
                      activeOverflow
                        ? activeOverflow.description
                        : "Mode tambahan: Review kode dan Jelaskan lesson.",
                    )
                  }
                  onBlur={hideTooltip}
                  aria-label={
                    activeOverflow
                      ? `Mode lainnya: ${activeOverflow.label} aktif`
                      : "Mode AI lainnya"
                  }
                  title={
                    activeOverflow
                      ? activeOverflow.description
                      : "Review kode dan Jelaskan lesson"
                  }
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1 rounded-[6px] border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none",
                    activeOverflow
                      ? "border-accent bg-accent text-accent-ink shadow-xs"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
                  )}
                >
                  {OverflowIcon ? (
                    <OverflowIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : null}
                  <span>{activeOverflow ? activeOverflow.label : "Lainnya"}</span>
                  <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1.5">
                {TUTOR_OVERFLOW_MODES.map((entry) => {
                  const Icon = modeIcons[entry.action];
                  const isActive = mode === entry.action;
                  return (
                    <DropdownMenuItem
                      key={entry.action}
                      onSelect={() => onModeChange(entry.action)}
                      className={cn(
                        "flex items-start gap-2.5 py-2",
                        isActive ? "bg-accent-soft text-ink" : undefined,
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          isActive ? "text-accent-text" : "text-muted",
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-ink">{entry.label}</p>
                        <p className="text-xs leading-snug text-muted">{entry.description}</p>
                      </div>
                      {isActive ? (
                        <Check className="mt-0.5 size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                      ) : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-canvas to-transparent"
          />
        </div>

        <DropdownMenu onOpenChange={(open) => { if (open) hideTooltip(); }}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Panduan semua mode AI Tutor"
              title="Panduan 7 mode AI Tutor"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
            >
              <HelpCircle className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-3">
            <p className="text-xs font-semibold text-ink">Panduan 7 Mode AI Tutor</p>
            <p className="mt-0.5 text-xs text-muted">
              Mode aktif: <span className="font-medium text-ink">{TUTOR_MODE_MAP[mode].label}</span>
            </p>
            <ul className="mt-2 space-y-1.5">
              {TUTOR_MODES.map((entry) => {
                const Icon = modeIcons[entry.action];
                const isActive = entry.action === mode;
                return (
                  <li
                    key={entry.action}
                    className={cn(
                      "flex items-start gap-2 rounded-[5px] px-2 py-1.5",
                      isActive ? "bg-accent-soft/75" : "",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        isActive ? "text-accent-text" : "text-muted",
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink">
                        {entry.label}
                        {isActive ? (
                          <span className="ml-1.5 text-xs font-normal text-accent-text">
                            (Aktif)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs leading-snug text-muted">{entry.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </DropdownMenuContent>
        </DropdownMenu>

        {tooltip ? (
          <div
            id={tooltipId}
            role="tooltip"
            style={{ left: `${tooltip.leftPx}px` }}
            className="pointer-events-none absolute top-full z-40 mt-1.5 w-max max-w-[min(84vw,18rem)] -translate-x-1/2 rounded-[6px] border border-line-strong bg-surface px-2.5 py-1.5 text-xs leading-snug text-ink shadow-md"
          >
            {tooltip.text}
          </div>
        ) : null}
      </div>
    </div>
  );
});
